// src/api/index.js
const B = '';
const tok = () => localStorage.getItem('sg_token') || '';

async function r(method, path, body, t) {
  const token = t || tok();
  const res = await fetch(B + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw Object.assign(new Error(`${method} ${path} → ${res.status}`), { status: res.status, body: err });
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : res.text();
}

export const api = {
  health:       ()           => r('GET',  '/api/health'),
  login:        (login, pw)  => r('POST', '/api/auth/login',  { login, password: pw }),
  me:           (t)          => r('GET',  '/api/me', null, t),

  rooms:        ()           => r('GET',  '/api/rooms'),
  room:         (id)         => r('GET',  `/api/rooms/${id}`),
  roomMembers:  (id)         => r('GET',  `/api/rooms/${id}/members`),
  messages:     (id, lim=60) => r('GET',  `/api/rooms/${id}/messages?limit=${lim}`),
  sendMsg:      (id, content)=> r('POST', `/api/rooms/${id}/messages`, { content }),
  deleteMsg:    (rid, mid)   => r('DELETE',`/api/rooms/${rid}/messages/${mid}`),
  pinMsg:       (rid, mid)   => r('POST', `/api/rooms/${rid}/messages/${mid}/pin`, {}),

  voiceState:   (id)         => r('GET',  `/api/voice/rooms/${id}/state`),
  voiceJoin:    (id)         => r('POST', `/api/voice/rooms/${id}/join`, {}),
  voiceLeave:   (id)         => r('POST', `/api/voice/rooms/${id}/leave`, {}),
  voiceSelf:    (id, data)   => r('PATCH',`/api/voice/rooms/${id}/self`, data),
  voiceKick:    (id, uid)    => r('POST', `/api/voice/rooms/${id}/kick`, { userId: uid }),
  voiceMute:    (id, uid)    => r('POST', `/api/voice/rooms/${id}/mute`, { userId: uid }),

  adminRooms:   ()           => r('GET',  '/api/admin/rooms'),
  adminUsers:   ()           => r('GET',  '/api/admin/users'),
  adminSystem:  ()           => r('GET',  '/api/admin/system'),

  aiAsk:        (id, msg)    => r('POST', `/api/ai/rooms/${id}/ask`,      { message: msg }),
  aiSummarize:  (id)         => r('POST', `/api/ai/rooms/${id}/summarize`, { limit: 50 }),
  aiDraft:      (id, ctx)    => r('POST', `/api/ai/rooms/${id}/draft`,    { context: ctx }),
};

// Нормализация пользователя из разных форматов API
export function normalizeUser(obj) {
  if (!obj) return null;
  return {
    id:          obj.id          || obj.userId      || obj.user_id,
    displayName: obj.displayName || obj.display_name|| obj.username || obj.login || 'Пользователь',
    username:    obj.username    || obj.login       || obj.email?.split('@')[0] || 'user',
    role:        obj.role        || obj.systemRole  || '',
    email:       obj.email       || '',
    avatarUrl:   obj.avatarUrl   || obj.avatar_url  || null,
  };
}

// Нормализация сообщения из разных форматов API
export function normalizeMsg(m) {
  const user = normalizeUser(
    m.user || m.author || m.sender ||
    (m.userId ? { id: m.userId, displayName: m.displayName || m.username, username: m.username, role: m.userRole } : null)
  );
  return {
    id:        m.id,
    content:   m.content || m.text || m.body || '',
    userId:    m.userId   || m.user_id || user?.id,
    user,
    createdAt: m.createdAt || m.created_at || m.timestamp || new Date().toISOString(),
    isPinned:  m.isPinned || m.is_pinned || false,
    editedAt:  m.editedAt || m.edited_at || null,
  };
}

export function connectWS(token, handlers) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${proto}://${location.host}/ws?token=${token}`;
  let ws;
  let reconnectTimer;
  let closed = false;

  function connect() {
    ws = new WebSocket(url);
    ws.onopen    = () => { handlers.onOpen?.(); };
    ws.onclose   = () => { handlers.onClose?.(); if (!closed) reconnectTimer = setTimeout(connect, 3000); };
    ws.onerror   = () => {};
    ws.onmessage = e => { try { handlers.onMessage?.(JSON.parse(e.data)); } catch {} };
  }
  connect();
  return () => { closed = true; clearTimeout(reconnectTimer); ws?.close(); };
}
