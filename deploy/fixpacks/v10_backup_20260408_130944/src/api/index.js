// api/index.js — единый клиент к Signum API
const BASE = '';

function getToken() {
  return localStorage.getItem('sg_token') || '';
}

async function req(method, path, body, token) {
  const t = token || getToken();
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opts);
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}`);
  return r.json();
}

export const api = {
  // Auth
  login: (login, password) => req('POST', '/api/auth/login', { login, password }),
  me:    (token) => req('GET', '/api/me', null, token),

  // Rooms
  rooms:       () => req('GET', '/api/rooms'),
  room:        (id) => req('GET', `/api/rooms/${id}`),
  messages:    (id, limit = 50) => req('GET', `/api/rooms/${id}/messages?limit=${limit}`),
  sendMessage: (id, content) => req('POST', `/api/rooms/${id}/messages`, { content }),
  deleteMessage: (roomId, msgId) => req('DELETE', `/api/rooms/${roomId}/messages/${msgId}`),

  // Voice
  voiceState:  (roomId) => req('GET', `/api/voice/rooms/${roomId}/state`),
  voiceJoin:   (roomId) => req('POST', `/api/voice/rooms/${roomId}/join`, {}),
  voiceLeave:  (roomId) => req('POST', `/api/voice/rooms/${roomId}/leave`, {}),
  voiceSelf:   (roomId, data) => req('PATCH', `/api/voice/rooms/${roomId}/self`, data),

  // Admin
  adminRooms:  () => req('GET', '/api/admin/rooms'),
  adminUsers:  () => req('GET', '/api/admin/users'),

  // Health
  health:      () => req('GET', '/api/health'),
};

export function connectSocket(token, handlers) {
  const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?token=${token}`;
  const ws = new WebSocket(WS_URL);
  ws.onopen    = () => handlers.onOpen?.();
  ws.onclose   = () => handlers.onClose?.();
  ws.onerror   = (e) => handlers.onError?.(e);
  ws.onmessage = (e) => {
    try { handlers.onMessage?.(JSON.parse(e.data)); } catch {}
  };
  return ws;
}
