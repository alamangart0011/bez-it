import fs from 'fs/promises';
import path from 'path';
import { withTransaction } from '../db/pg.js';
import { roomsRepository } from '../repositories/rooms.repository.js';
import { messagesRepository } from '../repositories/messages.repository.js';
import { uploadsRepository } from '../repositories/uploads.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { buildStoredFileName, getAttachmentKind, resolveUploadTarget, sanitizeFileName, validateUpload } from '../lib/files.js';

function canModerate(role) {
  return role === 'admin' || role === 'super_admin' || role === 'moderator';
}

async function ensureRoomAccess(roomId, userId) {
  const room = await roomsRepository.findById(roomId);
  if (!room) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Указанная комната не существует.');
  const allowed = await roomsRepository.userHasAccess(roomId, userId);
  if (!allowed) throw forbidden('ROOM_FORBIDDEN', 'Нет доступа к комнате', 'У вас нет доступа к этой комнате.');
  return room;
}

async function ensureMessageAccess(messageId, actorUser) {
  const message = await messagesRepository.findById(messageId);
  if (!message) throw notFound('MESSAGE_NOT_FOUND', 'Сообщение не найдено', 'Указанное сообщение не существует.');
  await ensureRoomAccess(message.roomId, actorUser.sub);
  return message;
}

async function withAttachments(messages) {
  const attachments = await uploadsRepository.listByMessageIds(messages.map((item) => item.id));
  const grouped = new Map();
  for (const attachment of attachments) {
    const current = grouped.get(attachment.messageId) || [];
    current.push(attachment);
    grouped.set(attachment.messageId, current);
  }
  return messages.map((item) => ({ ...item, attachments: grouped.get(item.id) || [] }));
}

export const roomsService = {
  async createRoom(actorUser, payload) {
    const name = String(payload?.name || '').trim();
    const kind = String(payload?.kind || 'group').trim();
    const allowedKinds = new Set(['group', 'voice', 'meeting']);
    if (!name) throw badRequest('ROOM_NAME_REQUIRED', 'Не указано название', 'Введите название комнаты.');
    if (!allowedKinds.has(kind)) throw badRequest('ROOM_KIND_INVALID', 'Неверный тип комнаты', 'Допустимые типы: group, voice, meeting.');
    const room = await withTransaction(async (client) => {
      const created = await roomsRepository.create({ name, kind, isPrivate: Boolean(payload?.isPrivate) }, client);
      await roomsRepository.addMembers(created.id, [actorUser.sub], client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'room.create', target: created.id, result: 'success', meta: { name, kind, isPrivate: Boolean(payload?.isPrivate) } }, client);
      return created;
    });
    return room;
  },

  async updateRoom(roomId, actorUser, payload) {
    await ensureRoomAccess(roomId, actorUser.sub);
    const patch = {};
    if (payload?.name !== undefined) {
      const name = String(payload.name || '').trim();
      if (!name) throw badRequest('ROOM_NAME_REQUIRED', 'Не указано название', 'Название комнаты не может быть пустым.');
      patch.name = name;
    }
    if (payload?.kind !== undefined) {
      const kind = String(payload.kind || '').trim();
      if (!['group', 'voice', 'meeting'].includes(kind)) {
        throw badRequest('ROOM_KIND_INVALID', 'Неверный тип комнаты', 'Допустимые типы: group, voice, meeting.');
      }
      patch.kind = kind;
    }
    if (payload?.isPrivate !== undefined) patch.isPrivate = Boolean(payload.isPrivate);
    const updated = await roomsRepository.updateById(roomId, patch);
    if (!updated) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Указанная комната не существует.');
    await auditRepository.create({ actorUserId: actorUser.sub, action: 'room.update', target: roomId, result: 'success', meta: patch });
    return updated;
  },

  async list(userId) {
    return roomsRepository.getAllForUser(userId);
  },

  async detail(roomId, userId) {
    const room = await ensureRoomAccess(roomId, userId);
    const members = await roomsRepository.getMembers(roomId);
    const stats = await roomsRepository.getRoomStats(roomId);
    return {
      ...room,
      members,
      memberCount: members.length,
      connectedVoiceCount: stats.connectedVoiceCount,
      raisedHandsCount: stats.raisedHandsCount,
      pendingJoinRequestsCount: stats.pendingJoinRequestsCount
    };
  },

  async members(roomId, userId) {
    await ensureRoomAccess(roomId, userId);
    return roomsRepository.getMembers(roomId);
  },

  async addMember(roomId, actorUser, targetUserId) {
    await ensureRoomAccess(roomId, actorUser.sub);
    if (!targetUserId) throw badRequest('ROOM_MEMBER_REQUIRED', 'Не выбран сотрудник', 'Укажите userId сотрудника для добавления.');
    await withTransaction(async (client) => {
      await roomsRepository.addMembers(roomId, [targetUserId], client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'room.member_add', target: targetUserId, result: 'success', meta: { roomId } }, client);
    });
    return { ok: true, roomId, userId: targetUserId };
  },

  async removeMember(roomId, actorUser, targetUserId) {
    await ensureRoomAccess(roomId, actorUser.sub);
    if (!targetUserId) throw badRequest('ROOM_MEMBER_REQUIRED', 'Не выбран сотрудник', 'Укажите userId сотрудника для удаления.');
    await withTransaction(async (client) => {
      await roomsRepository.removeMember(roomId, targetUserId, client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'room.member_remove', target: targetUserId, result: 'success', meta: { roomId } }, client);
    });
    return { ok: true, roomId, userId: targetUserId };
  },

  async joinOpenRoom(roomId, actorUser) {
    const room = await roomsRepository.findById(roomId);
    if (!room) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Указанная комната не существует.');
    if (room.isPrivate) throw forbidden('ROOM_PRIVATE', 'Комната приватная', 'Для входа в приватную комнату нужно приглашение.');
    await withTransaction(async (client) => {
      await roomsRepository.addMembers(roomId, [actorUser.sub], client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'room.join_open', target: roomId, result: 'success' }, client);
    });
    return { ok: true, roomId, userId: actorUser.sub };
  },

  async messages(roomId, userId) {
    await ensureRoomAccess(roomId, userId);
    const messages = await messagesRepository.listByRoom(roomId);
    return withAttachments(messages);
  },

  async pins(roomId, userId) {
    await ensureRoomAccess(roomId, userId);
    const messages = await messagesRepository.listPinnedByRoom(roomId);
    return withAttachments(messages);
  },

  async files(roomId, userId) {
    await ensureRoomAccess(roomId, userId);
    return uploadsRepository.listByRoom(roomId);
  },

  async search(roomId, userId, query) {
    await ensureRoomAccess(roomId, userId);
    const messages = await messagesRepository.searchInRoom(roomId, query);
    return withAttachments(messages);
  },

  async sendMessage({ roomId, actorUser, text, replyToMessageId = null }) {
    await ensureRoomAccess(roomId, actorUser.sub);
    const normalized = String(text || '').trim();
    if (!normalized) throw badRequest('MESSAGE_EMPTY', 'Пустое сообщение', 'Введите текст сообщения.');

    if (replyToMessageId) {
      const replyTarget = await messagesRepository.findById(replyToMessageId);
      if (!replyTarget || replyTarget.roomId !== roomId || replyTarget.isDeleted) {
        throw badRequest('REPLY_INVALID', 'Нельзя ответить на сообщение', 'Исходное сообщение не найдено в этой комнате.');
      }
    }

    const message = await withTransaction(async (client) => {
      const created = await messagesRepository.create({ roomId, authorId: actorUser.sub, text: normalized, replyToMessageId }, client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'message.create', target: created.id, result: 'success', meta: { roomId } }, client);
      return created;
    });

    return message;
  },

  async editMessage({ messageId, actorUser, text }) {
    await ensureMessageAccess(messageId, actorUser);
    const normalized = String(text || '').trim();
    if (!normalized) throw badRequest('MESSAGE_EMPTY', 'Пустое сообщение', 'Введите новый текст сообщения.');

    const updated = await messagesRepository.updateText({ messageId, authorId: actorUser.sub, text: normalized });
    if (!updated) throw forbidden('MESSAGE_EDIT_DENIED', 'Нельзя изменить сообщение', 'Сообщение уже удалено или принадлежит другому пользователю.');
    await auditRepository.create({ actorUserId: actorUser.sub, action: 'message.edit', target: messageId, result: 'success' });
    return messagesRepository.findById(messageId);
  },

  async deleteMessage({ messageId, actorUser }) {
    await ensureMessageAccess(messageId, actorUser);
    const deleted = await messagesRepository.markDeleted({ messageId, authorId: actorUser.sub, allowModerator: canModerate(actorUser.role) });
    if (!deleted) throw forbidden('MESSAGE_DELETE_DENIED', 'Нельзя удалить сообщение', 'У вас нет прав на удаление этого сообщения.');
    const message = await messagesRepository.findById(messageId);
    await auditRepository.create({ actorUserId: actorUser.sub, action: 'message.delete', target: messageId, result: 'success' });
    return { ok: true, roomId: message?.roomId || null };
  },

  async pinMessage({ messageId, actorUser, value }) {
    const message = await ensureMessageAccess(messageId, actorUser);
    if (!canModerate(actorUser.role)) {
      throw forbidden('PIN_DENIED', 'Нельзя закрепить сообщение', 'Закрепление доступно только модераторам и администраторам.');
    }
    const ok = await messagesRepository.setPinned({ messageId, value });
    if (!ok) throw notFound('MESSAGE_NOT_FOUND', 'Сообщение не найдено', 'Указанное сообщение не существует.');
    await auditRepository.create({ actorUserId: actorUser.sub, action: value ? 'message.pin' : 'message.unpin', target: messageId, result: 'success', meta: { roomId: message.roomId } });
    return { ok: true, roomId: message.roomId };
  },

  async upload({ roomId, actorUser, file, uploadRoot, maxUploadBytes }) {
    await ensureRoomAccess(roomId, actorUser.sub);
    validateUpload(file, maxUploadBytes);

    return withTransaction(async (client) => {
      const message = await messagesRepository.create({ roomId, authorId: actorUser.sub, text: `[файл] ${file.originalname}` }, client);
      const safeOriginalName = sanitizeFileName(file.originalname);
      const storedFileName = buildStoredFileName(safeOriginalName);
      const dir = resolveUploadTarget(uploadRoot, roomId);
      const fullPath = path.join(dir, storedFileName);
      await fs.writeFile(fullPath, file.buffer);
      const publicUrl = `/uploads/${roomId}/${storedFileName}`;
      const attachment = await uploadsRepository.createMetadata(client, {
        messageId: message.id,
        fileName: storedFileName,
        originalName: safeOriginalName,
        filePath: fullPath,
        publicUrl,
        contentType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        fileKind: getAttachmentKind(file.mimetype)
      });
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'upload.create', target: attachment.id, result: 'success', meta: { roomId, fileName: safeOriginalName } }, client);
      return { ...message, attachments: [attachment] };
    });
  }
};
