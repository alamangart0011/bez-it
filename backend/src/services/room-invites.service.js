/*
 * Сервис публичных приглашений в комнаты.
 * Создание защищено правом rooms.members_manage (или admin/moderator).
 * Токен — 22 символа base64url (128 бит энтропии).
 */

import crypto from 'crypto';
import { withTransaction } from '../db/pg.js';
import { badRequest, forbidden, notFound, conflict } from '../lib/errors.js';

const TOKEN_BYTES = 16;
const MAX_TTL_SEC = 60 * 60 * 24 * 30; // 30 суток

function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function canModerate(role) {
  return role === 'admin' || role === 'super_admin' || role === 'moderator';
}

function isExpired(invite) {
  if (invite.revokedAt) return true;
  if (invite.expiresAt && new Date(invite.expiresAt) <= new Date()) return true;
  if (invite.maxUses != null && invite.usedCount >= invite.maxUses) return true;
  return false;
}

function publicInvite(invite, room) {
  return {
    token:     invite.token,
    roomId:    invite.roomId,
    roomName:  room?.name || null,
    roomKind:  room?.kind || null,
    isPrivate: Boolean(room?.isPrivate),
    expiresAt: invite.expiresAt,
    maxUses:   invite.maxUses,
    usedCount: invite.usedCount,
    createdAt: invite.createdAt
  };
}

export function buildRoomInvitesService({
  roomInvitesRepository,
  roomsRepository,
  auditRepository
}) {
  async function ensureRoomModerator(roomId, actorUser) {
    const room = await roomsRepository.findById(roomId);
    if (!room) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Указанная комната не существует.');
    if (!canModerate(actorUser.role)) {
      const hasAccess = await roomsRepository.userHasAccess(roomId, actorUser.sub);
      if (!hasAccess) throw forbidden('ROOM_FORBIDDEN', 'Нет доступа к комнате', 'У вас нет доступа к этой комнате.');
      throw forbidden('INVITE_CREATE_DENIED', 'Нельзя создать приглашение', 'Создание приглашений доступно модераторам и администраторам.');
    }
    return room;
  }

  return {
    async createForRoom({ roomId, actorUser, ttlSec = null, maxUses = null, note = null }) {
      await ensureRoomModerator(roomId, actorUser);

      const ttl = ttlSec == null ? null : Math.max(60, Math.min(Number(ttlSec) || 0, MAX_TTL_SEC));
      const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : null;
      const uses = maxUses == null ? null : Math.max(1, Math.min(Number(maxUses) || 0, 1000));
      const trimmedNote = note == null ? null : String(note).slice(0, 200);

      const invite = await withTransaction(async (client) => {
        const token = generateToken();
        const created = await roomInvitesRepository.create(
          { roomId, token, createdBy: actorUser.sub, expiresAt, maxUses: uses, note: trimmedNote },
          client
        );
        await auditRepository.create(
          { actorUserId: actorUser.sub, action: 'room.invite_create', target: String(created.id), result: 'success', meta: { roomId, maxUses: uses, ttlSec: ttl } },
          client
        );
        return created;
      });

      return invite;
    },

    async listForRoom({ roomId, actorUser }) {
      await ensureRoomModerator(roomId, actorUser);
      return roomInvitesRepository.listActiveForRoom(roomId);
    },

    async revoke({ inviteId, actorUser }) {
      const invite = await roomInvitesRepository.findById(inviteId);
      if (!invite) throw notFound('INVITE_NOT_FOUND', 'Приглашение не найдено', 'Указанное приглашение не существует.');
      await ensureRoomModerator(invite.roomId, actorUser);
      await withTransaction(async (client) => {
        await roomInvitesRepository.revoke(invite.id, client);
        await auditRepository.create(
          { actorUserId: actorUser.sub, action: 'room.invite_revoke', target: String(invite.id), result: 'success', meta: { roomId: invite.roomId } },
          client
        );
      });
      return { ok: true };
    },

    async preview({ token }) {
      const trimmed = String(token || '').trim();
      if (!trimmed) throw badRequest('INVITE_TOKEN_REQUIRED', 'Не указан токен приглашения', 'Проверьте ссылку-приглашение.');
      const invite = await roomInvitesRepository.findByToken(trimmed);
      if (!invite || isExpired(invite)) {
        throw notFound('INVITE_INVALID', 'Приглашение недействительно', 'Срок действия ссылки истёк или она была отозвана.');
      }
      const room = await roomsRepository.findById(invite.roomId);
      if (!room) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Комната удалена или недоступна.');
      return publicInvite(invite, room);
    },

    async accept({ token, actorUser }) {
      const trimmed = String(token || '').trim();
      if (!trimmed) throw badRequest('INVITE_TOKEN_REQUIRED', 'Не указан токен приглашения', 'Проверьте ссылку-приглашение.');

      const invite = await roomInvitesRepository.findByToken(trimmed);
      if (!invite || isExpired(invite)) {
        throw notFound('INVITE_INVALID', 'Приглашение недействительно', 'Срок действия ссылки истёк или она была отозвана.');
      }
      const room = await roomsRepository.findById(invite.roomId);
      if (!room) throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Комната удалена или недоступна.');

      const alreadyMember = await roomsRepository.userHasAccess(invite.roomId, actorUser.sub);
      if (alreadyMember) {
        return { ok: true, roomId: invite.roomId, alreadyMember: true };
      }

      await withTransaction(async (client) => {
        await roomsRepository.addMembers(invite.roomId, [actorUser.sub], client);
        const updated = await roomInvitesRepository.incrementUsage(invite.id, client);
        if (updated && updated.maxUses != null && updated.usedCount >= updated.maxUses) {
          // Лимит исчерпан — явно помечаем отозванной.
          await roomInvitesRepository.revoke(invite.id, client);
        }
        await auditRepository.create(
          { actorUserId: actorUser.sub, action: 'room.invite_accept', target: String(invite.id), result: 'success', meta: { roomId: invite.roomId } },
          client
        );
      });

      return { ok: true, roomId: invite.roomId, alreadyMember: false };
    },

    isExpired
  };
}
