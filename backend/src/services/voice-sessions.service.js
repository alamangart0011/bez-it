import { voiceSessionsRepository } from '../repositories/voice-sessions.repository.js';
import { badRequest, notFound } from '../lib/errors.js';

export const voiceSessionsService = {
  async startSession(roomId) {
    if (!roomId) throw badRequest('VOICE_SESSION_ROOM_REQUIRED', 'Не указана комната', 'Для запуска сессии нужен roomId.');
    return voiceSessionsRepository.create(roomId);
  },

  async endSession(id) {
    const updated = await voiceSessionsRepository.endSession(id);
    if (!updated) throw notFound('VOICE_SESSION_NOT_FOUND', 'Сессия не найдена', 'Активная голосовая сессия не найдена.');
    return updated;
  },

  async getSession(id) {
    const session = await voiceSessionsRepository.findById(id);
    if (!session) throw notFound('VOICE_SESSION_NOT_FOUND', 'Сессия не найдена', 'Голосовая сессия не найдена.');
    const participants = await voiceSessionsRepository.participants(id);
    return { ...session, participants };
  },

  async listByRoom(roomId, limit = 20) {
    if (!roomId) throw badRequest('VOICE_SESSION_ROOM_REQUIRED', 'Не указана комната', 'Для списка нужен roomId.');
    return voiceSessionsRepository.listByRoom(roomId, limit);
  },

  async listActive() {
    return voiceSessionsRepository.listActive();
  },

  async getTranscript(sessionId, quality = 'final') {
    return voiceSessionsRepository.latestTranscript(sessionId, quality);
  },

  async saveTranscript(sessionId, quality, text, json, version = 1) {
    if (!sessionId) throw badRequest('VOICE_SESSION_REQUIRED', 'Не указана сессия', 'Для сохранения транскрипта нужен sessionId.');
    return voiceSessionsRepository.upsertTranscript(sessionId, quality || 'draft', text, json, version);
  }
};
