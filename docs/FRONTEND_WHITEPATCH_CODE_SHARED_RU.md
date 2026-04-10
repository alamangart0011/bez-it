# FRONTEND WHITEPATCH CODE — SHARED

## `frontend/src/shared/branding/defaults.js`

```jsx
export const BRANDING_DEFAULTS = {
  appName: 'Контур Связи',
  shortName: 'Сигнум',
  descriptor: 'Корпоративный контур связи',
  footer: 'Контур Связи · Корпоративный контур · V17',
  shellSignature: 'Корпоративный контур связи',
};
```

## `frontend/src/shared/runtime/constants.js`

```jsx
export const STORAGE_KEYS = {
  token: 'sg_token',
};

export const WS_RECONNECT_DELAY_MS = 3000;
export const VOICE_POLL_INTERVAL_MS = 8000;
export const TOAST_DURATION_MS = 3500;
export const MESSAGE_GROUP_WINDOW_MS = 300000;
```

## `frontend/src/shared/ui/tokens.js`

```jsx
export const C = {
  bg: '#f2f3f5',
  bg1: '#ffffff',
  bg2: '#f8f9fa',
  bg3: '#ebedf0',
  hov: 'rgba(0,0,0,.04)',
  act: 'rgba(88,101,242,.09)',
  brd: 'rgba(0,0,0,.09)',
  txt: '#060607',
  txt2: '#4e5058',
  txt3: '#80848e',
  acc: '#5865f2',
  acc2: '#4752c4',
  grn: '#1a8a4a',
  red: '#d73f3f',
  amb: '#b45309',
  pur: '#7c3aed',
  shd: '0 1px 4px rgba(0,0,0,.08)',
};

export const AVATAR_COLORS = ['#5865f2', '#d73f3f', '#1a8a4a', '#b45309', '#7c3aed', '#0891b2', '#c2410c', '#9c27b0'];

export function avC(id) {
  return AVATAR_COLORS[(id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
}

export function ini(name) {
  return (name || '?').trim().split(/\s+/).map((word) => word[0]).join('').toUpperCase().slice(0, 2);
}
```

## `frontend/src/shared/lib/formatters.js`

```jsx
export function fmtT(iso) {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

export function fmtD(iso) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
}

export function fmtPhone(value) {
  let n = String(value || '').replace(/\D/g, '');
  if (n[0] === '8') n = '7' + n.slice(1);
  if (!n.startsWith('7')) n = '7' + n;
  n = n.slice(0, 11);
  let result = '+7';
  if (n.length > 1) result += ` (${n.slice(1, 4)}`;
  if (n.length > 4) result += `) ${n.slice(4, 7)}`;
  if (n.length > 7) result += `-${n.slice(7, 9)}`;
  if (n.length > 9) result += `-${n.slice(9, 11)}`;
  return result;
}
```

## `frontend/src/shared/lib/normalizers.js`

```jsx
export function normalizeUser(raw) {
  if (!raw) return null;
  const id = raw.id || raw.userId || raw.user_id;
  const displayName =
    raw.displayName ||
    raw.display_name ||
    raw.username ||
    raw.login ||
    raw.email?.split('@')[0] ||
    'Пользователь';

  return {
    id,
    displayName,
    username: raw.username || displayName,
    email: raw.email || '',
    role: raw.role || raw.systemRole || '',
    avatarUrl: raw.avatarUrl || null,
    department: raw.department || raw.dept || '',
  };
}

export function normalizeMessage(raw) {
  const user = normalizeUser(
    raw?.user ||
      raw?.author ||
      raw?.sender ||
      (raw?.userId
        ? {
            id: raw.userId,
            displayName: raw.displayName || raw.display_name || raw.username,
            username: raw.username,
            role: raw.userRole || raw.role,
          }
        : null),
  );

  return {
    id: raw?.id || raw?._id,
    content: raw?.content || raw?.text || raw?.body || '',
    userId: raw?.userId || raw?.user_id || user?.id,
    user,
    createdAt: raw?.createdAt || raw?.created_at || raw?.timestamp || new Date().toISOString(),
    isPinned: Boolean(raw?.isPinned || raw?.is_pinned),
  };
}
```

## `frontend/src/shared/api/base.js`

```jsx
import { STORAGE_KEYS } from '../runtime/constants';

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.token) || '';
}

export async function request(method, path, body, customToken) {
  const token = customToken || getStoredToken();
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    throw Object.assign(new Error(`${response.status} ${path}${error ? `: ${error}` : ''}`), {
      status: response.status,
    });
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('json') ? response.json() : response.text();
}

export const api = {
  login: (login, password) => request('POST', '/api/auth/login', { login, password }),
  me: (token) => request('GET', '/api/me', null, token),
  rooms: () => request('GET', '/api/rooms'),
  createRoom: (payload) => request('POST', '/api/rooms', payload),
  updateRoom: (id, payload) => request('PATCH', `/api/rooms/${id}`, payload),
  messages: (id, limit = 60) => request('GET', `/api/rooms/${id}/messages?limit=${limit}`),
  sendMsg: (id, content) => request('POST', `/api/rooms/${id}/messages`, { content }),
  deleteMsg: (roomId, messageId) => request('DELETE', `/api/rooms/${roomId}/messages/${messageId}`),
  pinMsg: (roomId, messageId) => request('POST', `/api/rooms/${roomId}/messages/${messageId}/pin`, {}),
  members: (id) => request('GET', `/api/rooms/${id}/members`),
  addMember: (id, userId) => request('POST', `/api/rooms/${id}/members`, { userId }),
  rmMember: (id, userId) => request('DELETE', `/api/rooms/${id}/members/${userId}`),
  adminUsers: () => request('GET', '/api/admin/users'),
  adminRooms: () => request('GET', '/api/admin/rooms'),
  voiceState: (id) => request('GET', `/api/voice/rooms/${id}/state`),
  voiceJoin: (id) => request('POST', `/api/voice/rooms/${id}/join`, {}),
  voiceLeave: (id) => request('POST', `/api/voice/rooms/${id}/leave`, {}),
  voiceSelf: (id, payload) => request('PATCH', `/api/voice/rooms/${id}/self`, payload),
};
```

## `frontend/src/shared/rooms/collections.js`

```jsx
export function getTextRooms(rooms) {
  return (rooms || []).filter((room) => room.kind === 'group' || room.kind === 'dm' || room.kind === 'text' || !room.kind);
}

export function getVoiceRooms(rooms) {
  return (rooms || []).filter((room) => room.kind === 'voice');
}

export function getMeetingRooms(rooms) {
  return (rooms || []).filter((room) => room.kind === 'meeting');
}

export function getVisibleRooms(raw) {
  return (Array.isArray(raw) ? raw : raw?.rooms || []).filter((room) => !room.isArchived && !room.is_archived);
}
```

## `frontend/src/shared/messages/grouping.js`

```jsx
import { MESSAGE_GROUP_WINDOW_MS } from '../runtime/constants';
import { fmtD } from '../lib/formatters';

export function groupMessages(messages, search = '') {
  const filtered = (messages || []).filter(
    (message) => !search || String(message.content || '').toLowerCase().includes(search.toLowerCase()),
  );

  return filtered.reduce((acc, message, index) => {
    const prev = filtered[index - 1];
    const isContinuation =
      prev &&
      prev.userId === message.userId &&
      new Date(message.createdAt) - new Date(prev.createdAt) < MESSAGE_GROUP_WINDOW_MS;
    const needsDateDivider = !prev || fmtD(prev.createdAt) !== fmtD(message.createdAt);

    return [...acc, { ...message, cont: isContinuation, nd: needsDateDivider }];
  }, []);
}
```

## `frontend/src/shared/voice/helpers.js`

```jsx
export function isVoiceRoom(room) {
  return room?.kind === 'voice';
}

export function isMeetingRoom(room) {
  return room?.kind === 'meeting';
}

export function isLiveRoom(room) {
  return isVoiceRoom(room) || isMeetingRoom(room);
}

export function isUserInVoice(participants, userId) {
  return (participants || []).some((item) => item.userId === userId || item.id === userId);
}
```
