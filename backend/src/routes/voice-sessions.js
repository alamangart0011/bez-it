import { Router } from 'express';
import { voiceSessionsService } from '../services/voice-sessions.service.js';
import { sendError } from '../lib/http-error.js';

export function buildVoiceSessionsRouter({ io }) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const { room_id: roomId, active, limit } = req.query;
      if (active === 'true') return res.json(await voiceSessionsService.listActive());
      if (!roomId) return res.json([]);
      return res.json(await voiceSessionsService.listByRoom(roomId, Number(limit) || 20));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      return res.json(await voiceSessionsService.getSession(req.params.id));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/', async (req, res) => {
    try {
      const session = await voiceSessionsService.startSession(req.body?.room_id);
      if (io && session?.roomId) io.to(session.roomId).emit('voice-session:started', session);
      return res.status(201).json(session);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.patch('/:id/end', async (req, res) => {
    try {
      const session = await voiceSessionsService.endSession(req.params.id);
      if (io && session?.roomId) io.to(session.roomId).emit('voice-session:ended', session);
      return res.json(session);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.get('/:id/transcript', async (req, res) => {
    try {
      const transcript = await voiceSessionsService.getTranscript(req.params.id, req.query.quality || 'final');
      if (!transcript) return res.status(404).json({ code: 'NOT_FOUND', title: 'Транскрипт не найден', message: 'Для этой сессии транскрипт пока отсутствует.' });
      return res.json(transcript);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/:id/transcript', async (req, res) => {
    try {
      const saved = await voiceSessionsService.saveTranscript(
        req.params.id,
        req.body?.quality,
        req.body?.content_text,
        req.body?.content_json,
        req.body?.version || 1
      );
      return res.status(201).json(saved);
    } catch (error) {
      return sendError(res, error);
    }
  });

  return router;
}
