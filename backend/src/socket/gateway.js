import { jwtUtil } from '../lib/jwt.js';
import { roomsRepository } from '../repositories/rooms.repository.js';

function parseToken(socket) {
  const fromAuth = socket.handshake.auth?.token;
  const rawHeader = socket.handshake.headers.authorization || '';
  if (fromAuth) return fromAuth;
  if (rawHeader.startsWith('Bearer ')) return rawHeader.slice(7);
  return null;
}

function addToSetMap(map, key, value) {
  const current = map.get(key) || new Set();
  current.add(value);
  map.set(key, current);
  return current;
}

function removeFromSetMap(map, key, value) {
  const current = map.get(key);
  if (!current) return;
  current.delete(value);
  if (!current.size) map.delete(key);
}

function roomParticipants(roomSockets, roomId) {
  return Array.from(roomSockets.get(roomId) || []);
}

export function registerSocketGateway(io) {
  const userSockets = new Map();
  const roomSockets = new Map();
  const socketRooms = new Map();

  io.use((socket, next) => {
    try {
      const token = parseToken(socket);
      socket.user = jwtUtil.verifyAccess(token);
      next();
    } catch (error) {
      next(error);
    }
  });

  async function joinRoom(socket, roomId) {
    if (!roomId) return { ok: false, reason: 'ROOM_REQUIRED' };
    const allowed = await roomsRepository.userHasAccess(roomId, socket.user.sub);
    if (!allowed) return { ok: false, reason: 'ROOM_FORBIDDEN' };

    const peers = roomParticipants(roomSockets, roomId)
      .map((socketId) => io.sockets.sockets.get(socketId))
      .filter(Boolean)
      .map((peerSocket) => ({ userId: peerSocket.user.sub, socketId: peerSocket.id }))
      .filter((peer) => peer.socketId !== socket.id && peer.userId !== socket.user.sub);

    socket.join(roomId);
    addToSetMap(roomSockets, roomId, socket.id);
    addToSetMap(socketRooms, socket.id, roomId);
    socket.to(roomId).emit('room:peer-joined', { roomId, userId: socket.user.sub, socketId: socket.id });
    return { ok: true, peers };
  }

  function leaveRoom(socket, roomId) {
    socket.leave(roomId);
    removeFromSetMap(roomSockets, roomId, socket.id);
    removeFromSetMap(socketRooms, socket.id, roomId);
    socket.to(roomId).emit('room:peer-left', { roomId, userId: socket.user.sub, socketId: socket.id });
  }

  function canRelay(socket, roomId, toUserId) {
    if (!roomId || !toUserId) return false;
    const socketJoined = (socketRooms.get(socket.id) || new Set()).has(roomId);
    if (!socketJoined) return false;
    const targetSocketIds = userSockets.get(toUserId);
    if (!targetSocketIds?.size) return false;
    return Array.from(targetSocketIds).some((socketId) => (socketRooms.get(socketId) || new Set()).has(roomId));
  }

  io.on('connection', (socket) => {
    const user = socket.user;
    socket.join(`user:${user.sub}`);
    addToSetMap(userSockets, user.sub, socket.id);

    if ((userSockets.get(user.sub) || new Set()).size === 1) {
      io.emit('presence:update', { userId: user.sub, status: 'online' });
    }

    socket.emit('system:hello', { ok: true, socketId: socket.id, userId: user.sub });

    socket.on('room:join', async ({ roomId }, ack = () => {}) => {
      try {
        const result = await joinRoom(socket, roomId);
        ack(result);
      } catch {
        ack({ ok: false, reason: 'ROOM_JOIN_FAILED' });
      }
    });

    socket.on('room:leave', ({ roomId }) => {
      if (!roomId) return;
      leaveRoom(socket, roomId);
    });

    socket.on('message:typing', ({ roomId, value }) => {
      if (!(socketRooms.get(socket.id) || new Set()).has(roomId)) return;
      socket.to(roomId).emit('message:typing', { roomId, userId: user.sub, value: Boolean(value) });
    });

    socket.on('voice:speaking', ({ roomId, speaking }) => {
      if (!(socketRooms.get(socket.id) || new Set()).has(roomId)) return;
      socket.to(roomId).emit('voice:speaking', { roomId, userId: user.sub, speaking: Boolean(speaking) });
    });

    socket.on('voice:state', ({ roomId, patch }) => {
      if (!(socketRooms.get(socket.id) || new Set()).has(roomId)) return;
      socket.to(roomId).emit('voice:state', { roomId, userId: user.sub, patch: patch || {} });
    });

    socket.on('rtc:signal', ({ roomId, toUserId, description = null, candidate = null, media = 'voice' }) => {
      if (!canRelay(socket, roomId, toUserId)) return;
      const targetSocketIds = Array.from(userSockets.get(toUserId) || []);
      for (const targetSocketId of targetSocketIds) {
        if (!(socketRooms.get(targetSocketId) || new Set()).has(roomId)) continue;
        io.to(targetSocketId).emit('rtc:signal', {
          roomId,
          fromUserId: user.sub,
          fromSocketId: socket.id,
          media,
          description,
          candidate
        });
      }
    });

    socket.on('rtc:screen-state', ({ roomId, active }) => {
      if (!(socketRooms.get(socket.id) || new Set()).has(roomId)) return;
      socket.to(roomId).emit('rtc:screen-state', { roomId, userId: user.sub, active: Boolean(active) });
    });

    socket.on('rtc:voice-state', ({ roomId, muted }) => {
      if (!(socketRooms.get(socket.id) || new Set()).has(roomId)) return;
      socket.to(roomId).emit('rtc:voice-state', { roomId, userId: user.sub, muted: Boolean(muted) });
    });

    socket.on('disconnect', () => {
      const joinedRooms = Array.from(socketRooms.get(socket.id) || []);
      for (const roomId of joinedRooms) {
        leaveRoom(socket, roomId);
      }
      socketRooms.delete(socket.id);
      removeFromSetMap(userSockets, user.sub, socket.id);
      if (!(userSockets.get(user.sub) || new Set()).size) {
        io.emit('presence:update', { userId: user.sub, status: 'offline' });
      }
    });
  });
}
