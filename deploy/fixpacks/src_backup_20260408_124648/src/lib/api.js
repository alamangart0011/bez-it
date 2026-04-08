import { authStorage } from './auth';

let isRefreshing = false;
let refreshWaiters = [];

const errorTitles = {
  FORBIDDEN: 'Недостаточно прав для выполнения этого действия.',
  AUTH_REQUIRED: 'Требуется повторный вход в систему.',
  SESSION_REVOKED: 'Текущая сессия завершена. Выполните вход повторно.',
  ROOM_FORBIDDEN: 'У вас нет доступа к этой комнате.',
  PROFILE_READ_DENIED: 'Профиль недоступен для просмотра.',
  ADMIN_ACCESS_DENIED: 'Доступ в центр администратора закрыт для вашей роли.',
  SETTINGS_MANAGE_DENIED: 'Недостаточно прав для изменения настроек.',
  USER_NOT_FOUND: 'Пользователь не найден.',
  VOICE_BANNED: 'В этой комнате вам временно запрещён голосовой контур.',
  VOICE_NOT_JOINED: 'Сначала нужно войти в голосовую комнату.',
  VOICE_JOIN_REQUEST_REQUIRED: 'Для входа в эту комнату нужно одобрение ведущего или модератора.',
  VOICE_REQUEST_ALREADY_PENDING: 'Запрос уже отправлен. Дождитесь решения ведущего или модератора.',
  VOICE_REQUEST_NOT_FOUND: 'Заявка на вход не найдена или уже обработана.',
  VOICE_ENTRY_CLOSED: 'Вход в эту комнату временно закрыт ведущим или модератором.',
  INTERNAL_ERROR: 'Система не смогла завершить действие. Повторите попытку позже.'
};

function normalizeApiError(payload, fallback = 'Не удалось выполнить действие.') {
  if (!payload) return { title: 'Ошибка', message: fallback };
  return {
    code: payload.code,
    title: payload.title || 'Ошибка',
    message: errorTitles[payload.code] || payload.message || fallback,
    details: payload.details || null
  };
}

function resolveRefreshWaiters(error) {
  refreshWaiters.forEach((item) => item(error));
  refreshWaiters = [];
}

async function rawRequest(path, init = {}) {
  const token = authStorage.getAccessToken();
  const response = await fetch(`/api${path}`, {
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    },
    ...init
  });
  return response;
}

async function refreshSession() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshWaiters.push((error) => error ? reject(error) : resolve());
    });
  }

  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) throw new Error('NO_REFRESH');

  isRefreshing = true;
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) throw new Error('REFRESH_FAILED');
    const payload = await response.json();
    authStorage.setSession(payload);
    resolveRefreshWaiters(null);
  } catch (error) {
    authStorage.clear();
    resolveRefreshWaiters(error);
    throw error;
  } finally {
    isRefreshing = false;
  }
}

async function request(path, init = {}, attempt = 0) {
  const response = await rawRequest(path, init);
  if (response.status === 401 && attempt === 0 && authStorage.getRefreshToken()) {
    await refreshSession();
    return request(path, init, 1);
  }

  if (!response.ok) {
    let payload = null;
    try { payload = await response.json(); } catch {}
    throw normalizeApiError(payload);
  }

  return response.json();
}

export const api = {
  login: (login, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  refresh: (refreshToken) => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: (refreshToken) => request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logoutAll: (excludeCurrent = false) => request('/auth/logout-all', { method: 'POST', body: JSON.stringify({ excludeCurrent }) }),
  sessions: () => request('/auth/sessions'),
  revokeSession: (sessionId) => request(`/auth/sessions/${sessionId}`, { method: 'DELETE' }),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, newPassword, confirmPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword, confirmPassword }) }),
  invitePreview: (token) => request(`/auth/invite/${encodeURIComponent(token)}`),
  acceptInvite: (payload) => request('/auth/accept-invite', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/me'),
  updateMe: (payload) => request('/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  meSettings: () => request('/me/settings'),
  updateMeSettings: (payload) => request('/me/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  health: () => request('/health'),
  release: () => request('/release'),
  rtcConfig: () => request('/rtc/config'),
  rooms: () => request('/rooms'),
  room: (roomId) => request(`/rooms/${roomId}`),
  messages: (roomId) => request(`/rooms/${roomId}/messages`),
  roomPins: (roomId) => request(`/rooms/${roomId}/pins`),
  roomFiles: (roomId) => request(`/rooms/${roomId}/files`),
  roomSearch: (roomId, q) => request(`/rooms/${roomId}/search?q=${encodeURIComponent(q)}`),
  sendMessage: (roomId, text, replyToMessageId = null) => request(`/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ text, replyToMessageId }) }),
  editMessage: (messageId, text) => request(`/rooms/messages/${messageId}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  deleteMessage: (messageId) => request(`/rooms/messages/${messageId}`, { method: 'DELETE' }),
  pinMessage: (messageId) => request(`/rooms/messages/${messageId}/pin`, { method: 'POST' }),
  unpinMessage: (messageId) => request(`/rooms/messages/${messageId}/pin`, { method: 'DELETE' }),
  upload: (roomId, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/rooms/${roomId}/uploads`, { method: 'POST', body: form, headers: {} });
  },
  voiceState: (roomId) => request(`/voice/rooms/${roomId}/state`),
  voiceRequests: (roomId) => request(`/voice/rooms/${roomId}/requests`),
  voiceSetAccess: (roomId, payload) => request(`/voice/rooms/${roomId}/access`, { method: 'PATCH', body: JSON.stringify(payload) }),
  voiceRequestAccess: (roomId, payload) => request(`/voice/rooms/${roomId}/request-access`, { method: 'POST', body: JSON.stringify(payload) }),
  voiceReviewRequest: (roomId, payload) => request(`/voice/rooms/${roomId}/review-request`, { method: 'POST', body: JSON.stringify(payload) }),
  voiceJoin: (roomId, payload = {}) => request(`/voice/rooms/${roomId}/join`, { method: 'POST', body: JSON.stringify(payload) }),
  voiceLeave: (roomId) => request(`/voice/rooms/${roomId}/leave`, { method: 'POST', body: JSON.stringify({}) }),
  voiceSelf: (roomId, payload) => request(`/voice/rooms/${roomId}/self`, { method: 'PATCH', body: JSON.stringify(payload) }),
  voiceModerate: (roomId, payload) => request(`/voice/rooms/${roomId}/moderate`, { method: 'POST', body: JSON.stringify(payload) }),
  voiceBulk: (roomId, payload) => request(`/voice/rooms/${roomId}/bulk`, { method: 'POST', body: JSON.stringify(payload) }),
  voiceSummon: (roomId, payload) => request(`/voice/rooms/${roomId}/summon`, { method: 'POST', body: JSON.stringify(payload) }),
  voiceSummonMany: (roomId, payload) => request(`/voice/rooms/${roomId}/summon-many`, { method: 'POST', body: JSON.stringify(payload) }),
  meetingDetail: (roomId) => request(`/meetings/rooms/${roomId}`),
  updateMeeting: (roomId, payload) => request(`/meetings/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addMeetingEvent: (roomId, payload) => request(`/meetings/rooms/${roomId}/events`, { method: 'POST', body: JSON.stringify(payload) }),
  meetingAction: (roomId, payload) => request(`/meetings/rooms/${roomId}/actions`, { method: 'POST', body: JSON.stringify(payload) }),
  adminOverview: () => request('/admin/overview'),
  adminUsers: () => request('/admin/users'),
  adminUpdateUser: (userId, payload) => request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  adminRevokeUserSessions: (userId) => request(`/admin/users/${userId}/revoke-sessions`, { method: 'POST', body: JSON.stringify({}) }),
  adminRolesMatrix: () => request('/admin/roles-matrix'),
  adminSessions: () => request('/admin/sessions'),
  adminRooms: () => request('/admin/rooms'),
  adminCreateRoom: (payload) => request('/admin/rooms', { method: 'POST', body: JSON.stringify(payload) }),
  adminArchiveRoom: (roomId) => request(`/admin/rooms/${roomId}/archive`, { method: 'POST', body: JSON.stringify({}) }),
  adminOperatorAction: (roomId, payload) => request(`/admin/rooms/${roomId}/operator-action`, { method: 'POST', body: JSON.stringify(payload) }),
  adminDepartments: () => request('/admin/departments'),
  adminCreateDepartment: (payload) => request('/admin/departments', { method: 'POST', body: JSON.stringify(payload) }),
  adminInvitations: () => request('/admin/invitations'),
  adminCreateInvitation: (payload) => request('/admin/invitations', { method: 'POST', body: JSON.stringify(payload) }),
  adminSystem: () => request('/admin/system'),
  adminUpdateSystem: (payload) => request('/admin/system', { method: 'PUT', body: JSON.stringify(payload) }),
  adminIncidents: () => request('/admin/incidents'),
  adminAcknowledgeIncident: (incidentId) => request(`/admin/incidents/${incidentId}/ack`, { method: 'POST', body: JSON.stringify({}) }),
  adminResolveIncident: (incidentId) => request(`/admin/incidents/${incidentId}/resolve`, { method: 'POST', body: JSON.stringify({}) }),
  adminAnnouncement: () => request('/admin/announcement'),
  adminUpdateAnnouncement: (payload) => request('/admin/announcement', { method: 'PUT', body: JSON.stringify(payload) }),
  adminClearAnnouncement: () => request('/admin/announcement', { method: 'DELETE' }),
  audit: () => request('/admin/audit')
};
