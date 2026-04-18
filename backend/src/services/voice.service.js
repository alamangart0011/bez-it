import { withTransaction } from '../db/pg.js';
import { roomsRepository } from '../repositories/rooms.repository.js';
import { voiceRepository } from '../repositories/voice.repository.js';
import { usersRepository } from '../repositories/users.repository.js';
import { meetingsRepository } from '../repositories/meetings.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { incidentsRepository } from '../repositories/incidents.repository.js';
import { forbidden, notFound, badRequest } from '../lib/errors.js';
import { hasPermission } from '../lib/permissions.js';

async function ensureVoiceRoom(roomId, userId) {
  const room = await roomsRepository.findById(roomId);
  if (!room) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Указанная комната не существует.');
  if (!['voice', 'meeting'].includes(room.kind)) {
    throw badRequest('VOICE_ROOM_INVALID', 'Комната не поддерживает голос', 'Голосовой контур доступен только в голосовых комнатах и комнатах для собраний.');
  }
  const allowed = await roomsRepository.userHasAccess(roomId, userId);
  if (!allowed) throw forbidden('ROOM_FORBIDDEN', 'Нет доступа к комнате', 'У вас нет доступа к этой комнате.');
  return room;
}

function canModerateVoice(actorUser, roomKind) {
  return hasPermission(actorUser.role, 'voice.moderate') || (roomKind === 'meeting' && hasPermission(actorUser.role, 'meetings.manage'));
}

function ensureVoiceModeration(actorUser, roomKind) {
  const allowed = canModerateVoice(actorUser, roomKind);
  if (!allowed) throw forbidden('VOICE_MODERATION_DENIED', 'Недостаточно прав', 'Для этого действия нужны права модерации голоса.');
}

function patchForAction(action) {
  switch (action) {
    case 'mute': return { isMuted: true, isSpeaking: false };
    case 'unmute': return { isMuted: false };
    case 'deafen': return { isDeafened: true };
    case 'undeafen': return { isDeafened: false };
    case 'hand_up': return { handRaised: true };
    case 'hand_down': return { handRaised: false };
    case 'ban_voice': return { voiceBanned: true, isConnected: false, isSpeaking: false, handRaised: false, screenActive: false };
    case 'unban_voice': return { voiceBanned: false };
    case 'make_moderator': return { voiceRole: 'moderator' };
    case 'remove_moderator': return { voiceRole: 'member' };
    case 'assign_host': return { voiceRole: 'host' };
    case 'remove': return { isConnected: false, isSpeaking: false, handRaised: false, screenActive: false };
    default: return {};
  }
}

const bulkActionPatch = {
  mute_all: { isMuted: true, isSpeaking: false },
  unmute_all: { isMuted: false },
  lower_all_hands: { handRaised: false },
  disconnect_all: { isConnected: false, isSpeaking: false, handRaised: false, screenActive: false },
  stop_all_screens: { screenActive: false }
};

async function ensureVoiceTarget(roomId, targetUserId) {
  const allowed = await roomsRepository.userHasAccess(roomId, targetUserId);
  if (!allowed) throw notFound('VOICE_TARGET_NOT_FOUND', 'Сотрудник не найден в комнате', 'Указанный сотрудник не состоит в этой комнате.');
  const targetUser = await usersRepository.findById(targetUserId);
  if (!targetUser) throw notFound('USER_NOT_FOUND', 'Сотрудник не найден', 'Указанный сотрудник не существует.');
  return targetUser;
}

export const voiceService = {
  async summon(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    ensureVoiceModeration(actorUser, room.kind);
    if (payload.targetUserId === actorUser.sub) {
      throw badRequest('VOICE_SELF_TARGET', 'Нельзя вызвать самого себя', 'Для себя используйте обычный переход в комнату.');
    }
    const targetUser = await ensureVoiceTarget(roomId, payload.targetUserId);
    const actorRecord = await usersRepository.findById(actorUser.sub);
    const result = {
      roomId,
      roomName: room.name,
      roomKind: room.kind,
      targetUserId: targetUser.id,
      targetDisplayName: targetUser.displayName,
      actorUserId: actorUser.sub,
      actorDisplayName: actorRecord?.displayName || actorUser.sub,
      note: String(payload.note || '').trim() || null,
      createdAt: new Date().toISOString()
    };
    await auditRepository.create({ actorUserId: actorUser.sub, action: 'voice.summon', target: payload.targetUserId, result: 'success', meta: { roomId, roomKind: room.kind, note: result.note } });
    return result;
  },

  async summonMany(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    ensureVoiceModeration(actorUser, room.kind);
    const actorRecord = await usersRepository.findById(actorUser.sub);
    const items = [];
    for (const userId of payload.userIds) {
      if (!userId || userId === actorUser.sub) continue;
      const targetUser = await ensureVoiceTarget(roomId, userId);
      items.push({
        roomId,
        roomName: room.name,
        roomKind: room.kind,
        targetUserId: targetUser.id,
        targetDisplayName: targetUser.displayName,
        actorUserId: actorUser.sub,
        actorDisplayName: actorRecord?.displayName || actorUser.sub,
        note: String(payload.note || '').trim() || null,
        createdAt: new Date().toISOString()
      });
    }
    if (!items.length) {
      throw badRequest('VOICE_SUMMON_TARGETS_REQUIRED', 'Не выбраны сотрудники', 'Для массового вызова нужны сотрудники, отличные от инициатора.');
    }
    await auditRepository.create({ actorUserId: actorUser.sub, action: 'voice.summon_many', target: roomId, result: 'success', meta: { roomId, roomKind: room.kind, targets: items.map((item) => item.targetUserId), note: items[0]?.note || null } });
    return { roomId, roomName: room.name, roomKind: room.kind, count: items.length, items };
  },

  async setAccessMode(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    ensureVoiceModeration(actorUser, room.kind);
    const updated = await withTransaction(async (client) => {
      const value = await roomsRepository.setEntryMode(roomId, payload.entryMode, client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'voice.access_mode', target: roomId, result: 'success', meta: payload }, client);
      return value;
    });
    return updated;
  },

  async requestAccess(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    if (room.entryMode === 'closed') {
      throw forbidden('VOICE_ENTRY_CLOSED', 'Вход в комнату закрыт', 'Для этой комнаты ведущий или модератор полностью закрыл вход в голосовой контур.');
    }
    if (room.entryMode !== 'knock') {
      throw badRequest('VOICE_ENTRY_MODE_OPEN', 'Комната открыта для входа', 'Для этой комнаты не требуется запрос на вход.');
    }
    const existingPending = await voiceRepository.findPendingJoinRequest(roomId, actorUser.sub);
    if (existingPending) {
      throw badRequest('VOICE_REQUEST_ALREADY_PENDING', 'Запрос уже отправлен', 'Ожидайте решения ведущего или модератора по вашему запросу.');
    }
    const created = await withTransaction(async (client) => {
      const request = await voiceRepository.createJoinRequest(roomId, actorUser.sub, String(payload.note || '').trim(), client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'voice.request_access', target: roomId, result: 'success', meta: { note: request.note || null } }, client);
      return request;
    });
    return created;
  },

  async listRequests(roomId, actorUser) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    ensureVoiceModeration(actorUser, room.kind);
    return voiceRepository.listJoinRequests(roomId);
  },

  async reviewRequest(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    ensureVoiceModeration(actorUser, room.kind);
    const requests = await voiceRepository.listJoinRequests(roomId);
    const target = requests.find((item) => item.id === payload.requestId);
    if (!target || target.roomId !== roomId || target.status !== 'pending') {
      throw notFound('VOICE_REQUEST_NOT_FOUND', 'Заявка не найдена', 'Заявка уже обработана или отсутствует в этой комнате.');
    }
    const updated = await withTransaction(async (client) => {
      const result = await voiceRepository.reviewJoinRequest(payload.requestId, payload.status, actorUser.sub, client);
      if (room.kind === 'meeting') {
        await meetingsRepository.createPresenceLog(roomId, target.userId, actorUser.sub, payload.status === 'approved' ? 'approved' : 'denied', target.note || null, client);
      }
      if (payload.status === 'denied') {
        await incidentsRepository.create({
          roomId,
          actorUserId: actorUser.sub,
          targetUserId: target.userId,
          incidentType: 'entry_denied',
          severity: 'warning',
          note: target.note || 'Во входе в голосовой контур отказано модератором.',
          meta: { requestId: payload.requestId, roomKind: room.kind }
        }, client);
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: `voice.request_${payload.status}`, target: target.userId, result: 'success', meta: { roomId, requestId: payload.requestId } }, client);
      return result;
    });
    return { ...updated, roomName: room.name, roomKind: room.kind };
  },

  async bulkModerate(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    ensureVoiceModeration(actorUser, room.kind);
    const patch = bulkActionPatch[payload.action] || {};
    const state = await withTransaction(async (client) => {
      const updated = await voiceRepository.bulkPatchRoom(roomId, patch, client);
      if (payload.action === 'disconnect_all') {
        await incidentsRepository.create({
          roomId,
          actorUserId: actorUser.sub,
          incidentType: 'disconnect_all',
          severity: 'warning',
          note: payload.note || 'Выполнено массовое отключение всех участников от голосового контура.',
          meta: { roomKind: room.kind }
        }, client);
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: `voice.${payload.action}`, target: roomId, result: 'success', meta: { roomId, note: payload.note || null } }, client);
      return updated;
    });
    return { roomId, action: payload.action, state };
  },

  async state(roomId, actorUser) {
    await ensureVoiceRoom(roomId, actorUser.sub);
    return voiceRepository.listRoomState(roomId);
  },

  async presence(actorUser) {
    const rows = await voiceRepository.listAllConnected();
    const rooms = new Map();
    for (const row of rows) {
      if (!rooms.has(row.roomId)) rooms.set(row.roomId, []);
      rooms.get(row.roomId).push(row);
    }
    const roomIds = Array.from(rooms.keys());
    const roomDetails = await Promise.all(roomIds.map((id) => roomsRepository.findById(id)));
    const result = [];
    for (let i = 0; i < roomIds.length; i += 1) {
      const room = roomDetails[i];
      if (!room) continue;
      const participants = rooms.get(roomIds[i]) || [];
      result.push({
        roomId: room.id,
        roomName: room.name,
        roomKind: room.kind,
        isPrivate: Boolean(room.isPrivate),
        participantsCount: participants.length,
        participants
      });
    }
    result.sort((a, b) => b.participantsCount - a.participantsCount || a.roomName.localeCompare(b.roomName, 'ru'));
    return { rooms: result, generatedAt: new Date().toISOString(), viewerUserId: actorUser.sub };
  },

  async pullToRoom(targetRoomId, actorUser, payload) {
    const targetRoom = await ensureVoiceRoom(targetRoomId, actorUser.sub);
    ensureVoiceModeration(actorUser, targetRoom.kind);
    const targetUserId = String(payload?.targetUserId || '').trim();
    if (!targetUserId) {
      throw badRequest('VOICE_PULL_TARGET_REQUIRED', 'Не выбран сотрудник', 'Укажите userId сотрудника для перемещения.');
    }
    if (targetUserId === actorUser.sub) {
      throw badRequest('VOICE_SELF_TARGET', 'Нельзя тянуть самого себя', 'Для себя используйте обычный вход в комнату.');
    }
    const targetUser = await usersRepository.findById(targetUserId);
    if (!targetUser) throw notFound('USER_NOT_FOUND', 'Сотрудник не найден', 'Указанный сотрудник не существует.');

    const current = await voiceRepository.findConnectedRoomFor(targetUserId);
    const sourceRoomId = current?.roomId || null;

    const hasAccess = await roomsRepository.userHasAccess(targetRoomId, targetUserId);
    if (!hasAccess) {
      await roomsRepository.addMembers(targetRoomId, [targetUserId]);
    }

    return withTransaction(async (client) => {
      let participant;
      if (sourceRoomId && sourceRoomId !== targetRoomId) {
        const sourceRole = current?.voiceRole || 'member';
        participant = await voiceRepository.moveParticipant(sourceRoomId, targetRoomId, targetUserId, sourceRole, client);
        await incidentsRepository.create({
          roomId: sourceRoomId,
          actorUserId: actorUser.sub,
          targetUserId,
          incidentType: 'voice_moved',
          severity: 'low',
          note: `Сотрудник перетянут в комнату ${targetRoom.name}.`,
          meta: { fromRoomId: sourceRoomId, toRoomId: targetRoomId, roomKind: targetRoom.kind, via: 'pull' }
        }, client);
      } else {
        participant = await voiceRepository.upsertParticipant(targetRoomId, targetUserId, {
          voiceRole: current?.voiceRole || 'member',
          isConnected: true
        }, client);
      }
      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'voice.pull',
        target: targetUserId,
        result: 'success',
        meta: { fromRoomId: sourceRoomId, toRoomId: targetRoomId }
      }, client);
      return { participant, roomId: targetRoomId, sourceRoomId, action: 'pull', targetUser: { id: targetUser.id, displayName: targetUser.displayName } };
    });
  },

  async join(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    const current = await voiceRepository.findParticipant(roomId, actorUser.sub);
    if (current?.voiceBanned) {
      throw forbidden('VOICE_BANNED', 'Голос временно недоступен', 'В этой комнате вам временно запрещён голосовой контур.');
    }
    if (room.entryMode === 'closed' && !canModerateVoice(actorUser, room.kind)) {
      throw forbidden('VOICE_ENTRY_CLOSED', 'Вход в комнату закрыт', 'Для этой комнаты ведущий или модератор временно закрыл вход в голосовой контур.');
    }
    if (room.entryMode === 'knock' && !canModerateVoice(actorUser, room.kind)) {
      const latestRequest = await voiceRepository.findLatestJoinRequest(roomId, actorUser.sub);
      if (!latestRequest || latestRequest.status !== 'approved') {
        throw forbidden('VOICE_JOIN_REQUEST_REQUIRED', 'Нужен запрос на вход', 'Для этой комнаты ведущий или модератор должен одобрить вход в голосовой контур.');
      }
    }
    const result = await withTransaction(async (client) => {
      const joined = await voiceRepository.upsertParticipant(roomId, actorUser.sub, { ...payload, isConnected: true }, client);
      if (room.kind === 'meeting') {
        await meetingsRepository.createPresenceLog(roomId, actorUser.sub, actorUser.sub, 'joined', 'Сотрудник вошёл в голосовой контур собрания.', client);
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'voice.join', target: roomId, result: 'success', meta: { roomKind: room.kind } }, client);
      return joined;
    });
    return result;
  },

  async leave(roomId, actorUser) {
    await ensureVoiceRoom(roomId, actorUser.sub);
    const result = await withTransaction(async (client) => {
      const left = await voiceRepository.upsertParticipant(roomId, actorUser.sub, { isConnected: false, isSpeaking: false, handRaised: false, screenActive: false }, client);
      const room = await roomsRepository.findById(roomId);
      if (room?.kind === 'meeting') {
        await meetingsRepository.createPresenceLog(roomId, actorUser.sub, actorUser.sub, 'left', 'Сотрудник вышел из голосового контура собрания.', client);
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'voice.leave', target: roomId, result: 'success', meta: { roomId } }, client);
      return left;
    });
    return result;
  },

  async updateSelf(roomId, actorUser, payload) {
    await ensureVoiceRoom(roomId, actorUser.sub);
    const current = await voiceRepository.findParticipant(roomId, actorUser.sub);
    if (!current) {
      throw badRequest('VOICE_NOT_JOINED', 'Сначала войдите в голос', 'Перед изменением состояния нужно войти в голосовую комнату.');
    }
    return voiceRepository.patchParticipant(roomId, actorUser.sub, payload);
  },

  async moderate(roomId, actorUser, payload) {
    const room = await ensureVoiceRoom(roomId, actorUser.sub);
    ensureVoiceModeration(actorUser, room.kind);
    if (payload.targetUserId === actorUser.sub && payload.action !== 'assign_host') {
      throw badRequest('VOICE_SELF_TARGET', 'Нельзя применить это действие к себе', 'Для себя используйте собственные переключатели состояния.');
    }
    await ensureVoiceTarget(roomId, payload.targetUserId);

    return withTransaction(async (client) => {
      let participant;
      if (payload.action === 'move_to_room') {
        const targetRoom = await ensureVoiceRoom(payload.targetRoomId, actorUser.sub);
        const targetRole = (await voiceRepository.findParticipant(roomId, payload.targetUserId))?.voiceRole || 'member';
        participant = await voiceRepository.moveParticipant(roomId, targetRoom.id, payload.targetUserId, targetRole, client);
        if (room.kind === 'meeting') {
          await meetingsRepository.createPresenceLog(roomId, payload.targetUserId, actorUser.sub, 'moved_out', `Переведён из собрания в комнату ${targetRoom.name}.`, client);
        }
        if (targetRoom.kind === 'meeting') {
          await meetingsRepository.createPresenceLog(targetRoom.id, payload.targetUserId, actorUser.sub, 'moved_in', `Переведён в собрание из комнаты ${room.name}.`, client);
        }
        await incidentsRepository.create({
          roomId,
          actorUserId: actorUser.sub,
          targetUserId: payload.targetUserId,
          incidentType: 'voice_moved',
          severity: 'low',
          note: `Сотрудник переведён в комнату ${targetRoom.name}.`,
          meta: { fromRoomId: roomId, toRoomId: payload.targetRoomId, roomKind: room.kind }
        }, client);
        await auditRepository.create({ actorUserId: actorUser.sub, action: 'voice.move', target: payload.targetUserId, result: 'success', meta: { fromRoomId: roomId, toRoomId: payload.targetRoomId } }, client);
        return { participant, roomId: payload.targetRoomId, sourceRoomId: roomId, action: payload.action };
      }

      const current = await voiceRepository.findParticipant(roomId, payload.targetUserId);
      const moderationPatch = patchForAction(payload.action);
      participant = current
        ? await voiceRepository.patchParticipant(roomId, payload.targetUserId, moderationPatch, client)
        : await voiceRepository.upsertParticipant(roomId, payload.targetUserId, { isConnected: false, ...moderationPatch }, client);
      if (room.kind === 'meeting' && ['remove', 'ban_voice'].includes(payload.action)) {
        await meetingsRepository.createPresenceLog(roomId, payload.targetUserId, actorUser.sub, 'removed', payload.action === 'ban_voice' ? 'Сотруднику запрещён голос и он удалён из собрания.' : 'Сотрудник удалён из собрания модератором.', client);
      }
      if (payload.action === 'remove') {
        await incidentsRepository.create({ roomId, actorUserId: actorUser.sub, targetUserId: payload.targetUserId, incidentType: 'voice_removed', severity: 'warning', note: 'Сотрудник удалён из голосовой комнаты модератором.', meta: { roomKind: room.kind } }, client);
      }
      if (payload.action === 'ban_voice') {
        await incidentsRepository.create({ roomId, actorUserId: actorUser.sub, targetUserId: payload.targetUserId, incidentType: 'voice_banned', severity: 'critical', note: 'Сотруднику запрещён голосовой контур в комнате.', meta: { roomKind: room.kind } }, client);
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: `voice.${payload.action}`, target: payload.targetUserId, result: 'success', meta: { roomId } }, client);
      return { participant, roomId, action: payload.action };
    });
  }
};
