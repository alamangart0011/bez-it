import { Router } from 'express';
import { voiceService } from '../services/voice.service.js';
import { sendError } from '../lib/http-error.js';
import { validateVoiceAccessPayload, validateVoiceBulkPayload, validateVoiceJoinPayload, validateVoiceModerationPayload, validateVoiceRequestPayload, validateVoiceReviewPayload, validateVoiceSelfPayload, validateVoiceSummonPayload, validateVoiceSummonManyPayload } from '../validators/voice.validators.js';

function emitRoom(io, roomId, event, payload) {
  if (!io || !roomId) return;
  io.to(roomId).emit(event, payload);
}

export function buildVoiceRouter({ io }) {
  const router = Router();

  router.get('/rooms/:roomId/state', async (req, res) => {
    try {
      res.json(await voiceService.state(req.params.roomId, req.user));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.get('/presence', async (req, res) => {
    try {
      res.json(await voiceService.presence(req.user));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/pull', async (req, res) => {
    try {
      const result = await voiceService.pullToRoom(req.params.roomId, req.user, req.body);
      emitRoom(io, req.params.roomId, 'voice:moderation', { roomId: req.params.roomId, ...result });
      if (result.sourceRoomId && result.sourceRoomId !== result.roomId) {
        emitRoom(io, result.sourceRoomId, 'voice:moderation', { roomId: result.sourceRoomId, ...result });
      }
      if (io) io.emit('voice:presence-changed', { roomId: result.roomId, sourceRoomId: result.sourceRoomId, userId: result.targetUser?.id });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.get('/rooms/:roomId/requests', async (req, res) => {
    try {
      res.json(await voiceService.listRequests(req.params.roomId, req.user));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.patch('/rooms/:roomId/access', async (req, res) => {
    try {
      const payload = validateVoiceAccessPayload(req.body);
      const room = await voiceService.setAccessMode(req.params.roomId, req.user, payload);
      emitRoom(io, req.params.roomId, 'voice:access', { roomId: req.params.roomId, entryMode: room.entryMode });
      res.json(room);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/request-access', async (req, res) => {
    try {
      const payload = validateVoiceRequestPayload(req.body);
      const created = await voiceService.requestAccess(req.params.roomId, req.user, payload);
      emitRoom(io, req.params.roomId, 'voice:request', { roomId: req.params.roomId, request: created });
      res.status(201).json(created);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/review-request', async (req, res) => {
    try {
      const payload = validateVoiceReviewPayload(req.body);
      const reviewed = await voiceService.reviewRequest(req.params.roomId, req.user, payload);
      emitRoom(io, req.params.roomId, 'voice:request-review', { roomId: req.params.roomId, review: reviewed });
      if (io) io.to(`user:${reviewed.userId}`).emit('voice:request-status', reviewed);
      res.json(reviewed);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/join', async (req, res) => {
    try {
      const payload = validateVoiceJoinPayload(req.body);
      const joined = await voiceService.join(req.params.roomId, req.user, payload);
      emitRoom(io, req.params.roomId, 'voice:participant', { roomId: req.params.roomId, participant: joined, type: 'join' });
      if (io) io.emit('voice:presence-changed', { roomId: req.params.roomId, userId: req.user.sub, type: 'join' });
      res.status(201).json(joined);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/leave', async (req, res) => {
    try {
      const left = await voiceService.leave(req.params.roomId, req.user);
      emitRoom(io, req.params.roomId, 'voice:participant', { roomId: req.params.roomId, participant: left, type: 'leave' });
      if (io) io.emit('voice:presence-changed', { roomId: req.params.roomId, userId: req.user.sub, type: 'leave' });
      res.json(left);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.patch('/rooms/:roomId/self', async (req, res) => {
    try {
      const payload = validateVoiceSelfPayload(req.body);
      const state = await voiceService.updateSelf(req.params.roomId, req.user, payload);
      emitRoom(io, req.params.roomId, 'voice:participant', { roomId: req.params.roomId, participant: state, type: 'self' });
      res.json(state);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/summon', async (req, res) => {
    try {
      const payload = validateVoiceSummonPayload(req.body);
      const result = await voiceService.summon(req.params.roomId, req.user, payload);
      if (io) io.to(`user:${result.targetUserId}`).emit('voice:summon', result);
      res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/summon-many', async (req, res) => {
    try {
      const payload = validateVoiceSummonManyPayload(req.body);
      const result = await voiceService.summonMany(req.params.roomId, req.user, payload);
      if (io) {
        for (const item of result.items || []) {
          io.to(`user:${item.targetUserId}`).emit('voice:summon', item);
        }
      }
      res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/bulk', async (req, res) => {
    try {
      const payload = validateVoiceBulkPayload(req.body);
      const result = await voiceService.bulkModerate(req.params.roomId, req.user, payload);
      emitRoom(io, req.params.roomId, 'voice:bulk', result);
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/rooms/:roomId/moderate', async (req, res) => {
    try {
      const payload = validateVoiceModerationPayload(req.body);
      const result = await voiceService.moderate(req.params.roomId, req.user, payload);
      emitRoom(io, req.params.roomId, 'voice:moderation', { roomId: req.params.roomId, ...result });
      if (result.sourceRoomId && result.sourceRoomId !== result.roomId) {
        emitRoom(io, result.sourceRoomId, 'voice:moderation', { roomId: result.sourceRoomId, ...result });
      }
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  return router;
}
