import { apiRequest } from './apiBase';

export const RoomVoiceApi = {
  rooms: () => apiRequest('GET', '/api/rooms'),
  createRoom: (data) => apiRequest('POST', '/api/rooms', data),
  updateRoom: (id, data) => apiRequest('PATCH', `/api/rooms/${id}`, data),
  messages: (id, limit = 60) => apiRequest('GET', `/api/rooms/${id}/messages?limit=${limit}`),
  sendMessage: (id, content) => apiRequest('POST', `/api/rooms/${id}/messages`, { content }),
  deleteMessage: (roomId, messageId) => apiRequest('DELETE', `/api/rooms/${roomId}/messages/${messageId}`),
  pinMessage: (roomId, messageId) => apiRequest('POST', `/api/rooms/${roomId}/messages/${messageId}/pin`, {}),
  members: (id) => apiRequest('GET', `/api/rooms/${id}/members`),
  addMember: (id, userId) => apiRequest('POST', `/api/rooms/${id}/members`, { userId }),
  removeMember: (id, userId) => apiRequest('DELETE', `/api/rooms/${id}/members/${userId}`),
  voiceState: (id) => apiRequest('GET', `/api/voice/rooms/${id}/state`),
  voiceJoin: (id) => apiRequest('POST', `/api/voice/rooms/${id}/join`, {}),
  voiceLeave: (id) => apiRequest('POST', `/api/voice/rooms/${id}/leave`, {}),
  voiceSelf: (id, data) => apiRequest('PATCH', `/api/voice/rooms/${id}/self`, data),
};
