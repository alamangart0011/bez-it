import { Router } from 'express';
import { roomsService } from '../services/rooms.service.js';
import { adminService } from '../services/admin.service.js';
import { sendError } from '../lib/http-error.js';
import { requirePermission } from '../middleware/permissions.js';
import { createUploadMiddleware } from '../middleware/upload.js';
import { validateEditMessagePayload, validateRoomSearchQuery, validateSendMessagePayload, validateCreateRoomPayload } from '../validators/rooms.validators.js';

function emitRoom(io, roomId, event, payload) {
  if (!io || !roomId) return;
  io.to(roomId).emit(event, payload);
}

export function buildRoomsRouter({ io, uploadRoot, maxUploadBytes }) {
  const roomsRouter = Router();
  const upload = createUploadMiddleware(maxUploadBytes);

  roomsRouter.get('/', async (req, res) => {
    try {
      res.json(await roomsService.list(req.user.sub));
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.post('/', requirePermission('rooms.create'), async (req, res) => {
    try {
      const payload = validateCreateRoomPayload(req.body);
      const room = await adminService.createRoom(req.user, {
        name: payload.name,
        kind: payload.kind,
        isPrivate: false,
        ownerUserId: req.user.sub,
        memberIds: [],
        moderatorIds: []
      });
      res.status(201).json(room);
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.get('/:roomId', async (req, res) => {
    try {
      res.json(await roomsService.detail(req.params.roomId, req.user.sub));
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.get('/:roomId/messages', async (req, res) => {
    try {
      res.json(await roomsService.messages(req.params.roomId, req.user.sub));
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.get('/:roomId/pins', async (req, res) => {
    try {
      res.json(await roomsService.pins(req.params.roomId, req.user.sub));
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.get('/:roomId/files', async (req, res) => {
    try {
      res.json(await roomsService.files(req.params.roomId, req.user.sub));
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.get('/:roomId/search', async (req, res) => {
    try {
      const query = validateRoomSearchQuery(req.query);
      res.json(await roomsService.search(req.params.roomId, req.user.sub, query));
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.post('/:roomId/messages', async (req, res) => {
    try {
      const payload = validateSendMessagePayload(req.body);
      const created = await roomsService.sendMessage({ roomId: req.params.roomId, actorUser: req.user, ...payload });
      emitRoom(io, req.params.roomId, 'message:created', { roomId: req.params.roomId, messageId: created.id });
      res.status(201).json(created);
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.patch('/messages/:messageId', async (req, res) => {
    try {
      const payload = validateEditMessagePayload(req.body);
      const updated = await roomsService.editMessage({ messageId: req.params.messageId, actorUser: req.user, ...payload });
      emitRoom(io, updated.roomId, 'message:updated', { roomId: updated.roomId, messageId: updated.id });
      res.json(updated);
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.delete('/messages/:messageId', async (req, res) => {
    try {
      const result = await roomsService.deleteMessage({ messageId: req.params.messageId, actorUser: req.user });
      emitRoom(io, result.roomId, 'message:deleted', { roomId: result.roomId, messageId: req.params.messageId });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.post('/messages/:messageId/pin', requirePermission('messages.moderate'), async (req, res) => {
    try {
      const result = await roomsService.pinMessage({ messageId: req.params.messageId, actorUser: req.user, value: true });
      emitRoom(io, result.roomId, 'message:pinned', { roomId: result.roomId, messageId: req.params.messageId, value: true });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.delete('/messages/:messageId/pin', requirePermission('messages.moderate'), async (req, res) => {
    try {
      const result = await roomsService.pinMessage({ messageId: req.params.messageId, actorUser: req.user, value: false });
      emitRoom(io, result.roomId, 'message:pinned', { roomId: result.roomId, messageId: req.params.messageId, value: false });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  roomsRouter.post('/:roomId/uploads', requirePermission('files.upload'), upload.single('file'), async (req, res) => {
    try {
      const created = await roomsService.upload({ roomId: req.params.roomId, actorUser: req.user, file: req.file, uploadRoot, maxUploadBytes });
      emitRoom(io, req.params.roomId, 'message:created', { roomId: req.params.roomId, messageId: created.id });
      res.status(201).json(created);
    } catch (error) {
      return sendError(res, error);
    }
  });


// ═══ V18 CONTRACT FIX: недостающие routes ═══

roomsRouter.patch('/:roomId', async (req, res) => {
  try {
    const updated = await roomsService.updateRoom(req.params.roomId, req.user, req.body || {});
    res.json(updated);
  } catch (error) {
    return sendError(res, error);
  }
});

roomsRouter.get('/:roomId/members', async (req, res) => {
  try {
    res.json(await roomsService.members(req.params.roomId, req.user.sub));
  } catch (error) {
    return sendError(res, error);
  }
});

roomsRouter.post('/:roomId/members', async (req, res) => {
  try {
    const result = await roomsService.addMember(req.params.roomId, req.user, req.body?.userId);
    res.status(201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

roomsRouter.delete('/:roomId/members/:userId', async (req, res) => {
  try {
    const result = await roomsService.removeMember(req.params.roomId, req.user, req.params.userId);
    res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

roomsRouter.post('/:roomId/join', async (req, res) => {
  try {
    const result = await roomsService.joinOpenRoom(req.params.roomId, req.user);
    res.status(201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});
  return roomsRouter;
}
