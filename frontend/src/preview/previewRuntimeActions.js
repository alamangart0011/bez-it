async function callApi(method, path, body) {
  const token = (() => {
    try {
      return localStorage.getItem('sg_token') || '';
    } catch {
      return '';
    }
  })();

  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('json') ? await response.json().catch(() => ({})) : await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || payload?.error || `${response.status} ${path}`);
  }
  return payload;
}

export async function previewCreateRoom(name, kind = 'group') {
  return callApi('POST', '/api/rooms', { name, kind });
}

export async function previewSendMessage(roomId, text) {
  return callApi('POST', `/api/rooms/${roomId}/messages`, { text, content: text });
}

export async function previewVoiceJoin(roomId) {
  return callApi('POST', `/api/voice/rooms/${roomId}/join`, {});
}

export async function previewVoiceLeave(roomId) {
  return callApi('POST', `/api/voice/rooms/${roomId}/leave`, {});
}

export async function previewVoiceSelf(roomId, patch) {
  return callApi('PATCH', `/api/voice/rooms/${roomId}/self`, patch);
}

export async function previewFetchAdminOverview() {
  return callApi('GET', '/api/admin/overview');
}

export async function previewFetchInvitations() {
  return callApi('GET', '/api/admin/invitations');
}

export async function previewFetchIncidents() {
  return callApi('GET', '/api/admin/incidents');
}
