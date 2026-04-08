import { withTransaction } from '../db/pg.js';
import { roomsRepository } from '../repositories/rooms.repository.js';
import { meetingsRepository } from '../repositories/meetings.repository.js';
import { messagesRepository } from '../repositories/messages.repository.js';
import { uploadsRepository } from '../repositories/uploads.repository.js';
import { voiceRepository } from '../repositories/voice.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { forbidden, notFound, badRequest } from '../lib/errors.js';
import { hasPermission } from '../lib/permissions.js';

async function ensureMeetingRoom(roomId, userId) {
  const room = await roomsRepository.findById(roomId);
  if (!room) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Указанная комната не существует.');
  if (room.kind !== 'meeting') {
    throw badRequest('MEETING_ROOM_INVALID', 'Это не комната для собраний', 'Указанная комната не относится к типу собраний.');
  }
  const allowed = await roomsRepository.userHasAccess(roomId, userId);
  if (!allowed) throw forbidden('ROOM_FORBIDDEN', 'Нет доступа к комнате', 'У вас нет доступа к этой комнате.');
  return room;
}

function ensureManage(actorUser) {
  if (!hasPermission(actorUser.role, 'meetings.manage')) {
    throw forbidden('MEETING_MANAGE_DENIED', 'Недостаточно прав', 'Для изменения собрания нужны права управления собраниями.');
  }
}

export const meetingsService = {
  async detail(roomId, actorUser) {
    await ensureMeetingRoom(roomId, actorUser.sub);
    let meeting = await meetingsRepository.findByRoomId(roomId);
    if (!meeting) meeting = await meetingsRepository.ensureRoom(roomId, actorUser.sub);
    const roomMembers = await roomsRepository.getMembers(roomId);
    const voiceState = await voiceRepository.listRoomState(roomId);
    const [events, presenceJournal] = await Promise.all([
      meetingsRepository.listEvents(roomId),
      meetingsRepository.listPresenceLog(roomId)
    ]);
    const messages = await messagesRepository.listPinnedByRoom(roomId);
    const attachments = await uploadsRepository.listByMessageIds(messages.map((item) => item.id));
    return {
      meeting,
      members: roomMembers,
      voiceState,
      events,
      presenceJournal,
      materials: attachments,
      pins: messages
    };
  },

  async update(roomId, actorUser, patch) {
    await ensureMeetingRoom(roomId, actorUser.sub);
    ensureManage(actorUser);
    return withTransaction(async (client) => {
      await meetingsRepository.ensureRoom(roomId, actorUser.sub, client);
      const nextPatch = { ...patch };
      if (patch.status === 'active') nextPatch.startedAt = new Date().toISOString();
      if (patch.status === 'closed') nextPatch.endedAt = new Date().toISOString();
      const updated = await meetingsRepository.update(roomId, nextPatch, client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'meeting.update', target: roomId, result: 'success', meta: patch }, client);
      return updated;
    });
  },



  async runAction(roomId, actorUser, payload) {
    await ensureMeetingRoom(roomId, actorUser.sub);
    ensureManage(actorUser);
    return withTransaction(async (client) => {
      await meetingsRepository.ensureRoom(roomId, actorUser.sub, client);
      let actionLabel = 'Быстрое действие собрания выполнено.';
      if (payload.action === 'open_meeting') {
        await meetingsRepository.update(roomId, { status: 'active', startedAt: new Date().toISOString(), endedAt: null }, client);
        await meetingsRepository.createEvent(roomId, actorUser.sub, 'start', payload.note || 'Собрание открыто ведущим.', client);
        actionLabel = 'Собрание открыто.';
      }
      if (payload.action === 'close_meeting') {
        await meetingsRepository.update(roomId, { status: 'closed', endedAt: new Date().toISOString(), summary: payload.note || undefined }, client);
        await meetingsRepository.createEvent(roomId, actorUser.sub, 'finish', payload.note || 'Собрание завершено ведущим.', client);
        actionLabel = 'Собрание завершено.';
      }
      if (payload.action === 'mute_all') {
        await voiceRepository.bulkPatchRoom(roomId, { isMuted: true, isSpeaking: false }, client);
        await meetingsRepository.createEvent(roomId, actorUser.sub, 'action', payload.note || 'Всем участникам отключены микрофоны.', client);
        actionLabel = 'Микрофоны отключены у всех участников.';
      }
      if (payload.action === 'lower_all_hands') {
        await voiceRepository.bulkPatchRoom(roomId, { handRaised: false }, client);
        await meetingsRepository.createEvent(roomId, actorUser.sub, 'action', payload.note || 'Все поднятые руки сброшены.', client);
        actionLabel = 'Поднятые руки сброшены.';
      }
      if (payload.action === 'stop_all_screens') {
        await voiceRepository.bulkPatchRoom(roomId, { screenActive: false }, client);
        await meetingsRepository.createEvent(roomId, actorUser.sub, 'action', payload.note || 'Демонстрации экрана остановлены.', client);
        actionLabel = 'Все демонстрации экрана остановлены.';
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: `meeting.action.${payload.action}`, target: roomId, result: 'success', meta: payload }, client);
      const meeting = await meetingsRepository.findByRoomId(roomId, client);
      const voiceState = await voiceRepository.listRoomState(roomId);
      return { ok: true, action: payload.action, label: actionLabel, meeting, voiceState };
    });
  },

  async createEvent(roomId, actorUser, payload) {
    await ensureMeetingRoom(roomId, actorUser.sub);
    if (!hasPermission(actorUser.role, 'meetings.manage') && !hasPermission(actorUser.role, 'messages.write')) {
      throw forbidden('MEETING_EVENT_DENIED', 'Недостаточно прав', 'У вас нет прав на добавление событий собрания.');
    }
    return withTransaction(async (client) => {
      await meetingsRepository.ensureRoom(roomId, actorUser.sub, client);
      const event = await meetingsRepository.createEvent(roomId, actorUser.sub, payload.eventType, payload.body, client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: `meeting.event.${payload.eventType}`, target: roomId, result: 'success' }, client);
      return event;
    });
  }
};
