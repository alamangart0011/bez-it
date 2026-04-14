import { useCallback, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'sg_token';

function token() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

async function api(method, path, body) {
  const currentToken = token();
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('json') ? await response.json().catch(() => ({})) : await response.text().catch(() => '');
  if (!response.ok) {
    const message = payload?.detail || payload?.message || payload?.error || `${response.status} ${path}`;
    throw new Error(message);
  }
  return payload;
}

function normalizeUser(raw) {
  if (!raw) return null;
  return {
    id: raw.id || raw.userId || raw.user_id || '',
    name: raw.displayName || raw.display_name || raw.fullName || raw.full_name || raw.username || (raw.email ? raw.email.split('@')[0] : 'Пользователь'),
    email: raw.email || '',
    role: raw.role || raw.systemRole || '',
  };
}

function normalizeMessage(raw) {
  return {
    id: raw.id || raw._id || '',
    text: raw.content || raw.text || raw.body || '',
    createdAt: raw.createdAt || raw.created_at || raw.timestamp || new Date().toISOString(),
    user: normalizeUser(raw.user || raw.author || raw.sender || { id: raw.userId || raw.user_id, displayName: raw.displayName || raw.display_name, username: raw.username, email: raw.email, role: raw.userRole || raw.role }),
  };
}

export function useRoomBasedPreviewRuntime(initialRoomId = '') {
  const [rooms, setRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const currentRoom = useMemo(() => rooms.find((room) => String(room.id) === String(currentRoomId)) || null, [rooms, currentRoomId]);

  const loadRooms = useCallback(async (reset = false) => {
    const payload = await api('GET', '/api/rooms');
    const list = Array.isArray(payload) ? payload : payload.rooms || [];
    setRooms(list);
    if (reset || !currentRoomId || !list.some((room) => String(room.id) === String(currentRoomId))) {
      setCurrentRoomId(list[0]?.id || '');
    }
    return list;
  }, [currentRoomId]);

  const loadMe = useCallback(async () => {
    const payload = await api('GET', '/api/me');
    setUser(normalizeUser(payload.user || payload));
  }, []);

  const loadRoomRuntime = useCallback(async (roomId) => {
    if (!roomId) return;
    const selected = rooms.find((room) => String(room.id) === String(roomId)) || null;
    const [roomMessages, roomMembers, voiceState] = await Promise.all([
      api('GET', `/api/rooms/${roomId}/messages`).catch(() => []),
      api('GET', `/api/rooms/${roomId}/members`).catch(() => []),
      selected && ['voice', 'meeting'].includes(selected.kind) ? api('GET', `/api/voice/rooms/${roomId}/state`).catch(() => null) : Promise.resolve(null),
    ]);
    setMessages((Array.isArray(roomMessages) ? roomMessages : roomMessages.messages || []).map(normalizeMessage));
    setMembers((Array.isArray(roomMembers) ? roomMembers : roomMembers.members || roomMembers.items || []).map(normalizeUser).filter(Boolean));
    setParticipants(voiceState ? voiceState.participants || voiceState.users || [] : []);
  }, [rooms]);

  const refreshAll = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await loadMe();
      const list = await loadRooms(!currentRoomId);
      const targetRoomId = currentRoomId || list[0]?.id || '';
      if (targetRoomId) await loadRoomRuntime(targetRoomId);
    } catch (nextError) {
      setError(nextError.message || 'Не удалось загрузить runtime preview.');
    } finally {
      setBusy(false);
    }
  }, [currentRoomId, loadMe, loadRooms, loadRoomRuntime]);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!currentRoomId) return;
    loadRoomRuntime(currentRoomId).catch((nextError) => setError(nextError.message || 'Не удалось загрузить комнату.'));
  }, [currentRoomId, loadRoomRuntime]);

  return {
    busy,
    error,
    user,
    rooms,
    currentRoom,
    currentRoomId,
    setCurrentRoomId,
    messages,
    members,
    participants,
    refreshAll,
  };
}
