/*
 * Клиентские помощники для общей картины «кто в какой голосовой комнате»
 * и перетаскивания (drag-and-drop) сотрудников к себе.
 *
 * Использование:
 *   const presence = await fetchPresence(accessToken);
 *   await pullToRoom({ roomId, targetUserId, accessToken });
 *
 *   // live-обновления приходят по сокетам:
 *   socket.on('voice:presence-changed', () => refetchPresence())
 *   socket.on('voice:moderation',       () => refetchPresence())
 *   socket.on('voice:participant',      () => refetchPresence())
 */

function authHeaders(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function jsonOrThrow(res, label) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `${label}_${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchPresence(accessToken) {
  const res = await fetch('/api/voice/presence', { headers: authHeaders(accessToken) });
  return jsonOrThrow(res, 'PRESENCE_HTTP');
}

export async function fetchRoomVoiceState({ roomId, accessToken }) {
  const res = await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/state`, { headers: authHeaders(accessToken) });
  return jsonOrThrow(res, 'VOICE_STATE_HTTP');
}

export async function joinVoice({ roomId, accessToken }) {
  const res = await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({})
  });
  return jsonOrThrow(res, 'VOICE_JOIN_HTTP');
}

export async function leaveVoice({ roomId, accessToken }) {
  const res = await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: 'POST',
    headers: authHeaders(accessToken)
  });
  return jsonOrThrow(res, 'VOICE_LEAVE_HTTP');
}

export async function pullToRoom({ roomId, targetUserId, accessToken }) {
  const res = await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ targetUserId })
  });
  return jsonOrThrow(res, 'VOICE_PULL_HTTP');
}

export async function summonToRoom({ roomId, targetUserId, note, accessToken }) {
  const res = await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/summon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify({ targetUserId, note: note || null })
  });
  return jsonOrThrow(res, 'VOICE_SUMMON_HTTP');
}

/*
 * Готовая схема обработки drag-and-drop сотрудника из одной комнаты в другую.
 *   const onDrop = createDropToRoomHandler({ accessToken, onSuccess, onError });
 *   <div onDragOver={e => e.preventDefault()} onDrop={(e) => onDrop(e, roomId)} />
 * В источник (draggable): event.dataTransfer.setData('application/x-kontur-user', userId)
 */
export function createDropToRoomHandler({ accessToken, onSuccess, onError }) {
  return async (event, roomId) => {
    try {
      event.preventDefault();
      const userId = event.dataTransfer?.getData('application/x-kontur-user');
      if (!userId || !roomId) return;
      const result = await pullToRoom({ roomId, targetUserId: userId, accessToken });
      onSuccess?.(result);
    } catch (error) {
      onError?.(error);
    }
  };
}
