import crypto from 'crypto';
import { withTransaction } from '../db/pg.js';
import { badRequest, notFound } from '../lib/errors.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { authRepository } from '../repositories/auth.repository.js';
import { meetingsRepository } from '../repositories/meetings.repository.js';
import { profilesRepository } from '../repositories/profiles.repository.js';
import { roomsRepository } from '../repositories/rooms.repository.js';
import { systemRepository } from '../repositories/system.repository.js';
import { usersRepository } from '../repositories/users.repository.js';
import { voiceRepository } from '../repositories/voice.repository.js';
import { getMatrixView, permissionsCatalog } from '../lib/permissions.js';
import { incidentsRepository } from '../repositories/incidents.repository.js';

function demoInviteLink(token) {
  return `/invite/${encodeURIComponent(token)}`;
}

async function ensureUserExists(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw notFound('USER_NOT_FOUND', 'Пользователь не найден', 'Указанный пользователь отсутствует в системе.');
  }
  return user;
}

async function ensureRoomExists(roomId) {
  const room = await roomsRepository.findById(roomId);
  if (!room) {
    throw notFound('ROOM_NOT_FOUND', 'Комната не найдена', 'Указанная комната отсутствует в системе.');
  }
  return room;
}

export const adminService = {
  async overview() {
    const [users, rooms, audit, departments, roleMatrix, userList, system, invitations, sessions, launchBoard, launchMonitor, operatorWallboard] = await Promise.all([
      usersRepository.getOverview(),
      roomsRepository.getOverview(),
      auditRepository.overview(),
      profilesRepository.listDepartments(),
      Promise.resolve(getMatrixView()),
      profilesRepository.listUsersForAdmin(),
      systemRepository.getRuntimeConfig(),
      authRepository.listInvitations(),
      authRepository.listAllSessions(),
      meetingsRepository.getLaunchBoard(),
      incidentsRepository.getLaunchMonitor(),
      roomsRepository.getOperatorWallboard()
    ]);

    return {
      users,
      rooms,
      audit,
      departments,
      roleMatrix,
      permissionCatalog: permissionsCatalog,
      spotlightUsers: userList.slice(0, 8),
      invitations: {
        total: invitations.length,
        active: invitations.filter((item) => !item.acceptedAt && new Date(item.expiresAt).getTime() > Date.now()).length
      },
      sessions: {
        total: sessions.length,
        active: sessions.filter((item) => !item.revokedAt && new Date(item.expiresAt).getTime() > Date.now()).length
      },
      system,
      launchBoard,
      launchMonitor,
      operatorWallboard,
      generatedAt: new Date().toISOString()
    };
  },

  async incidents() {
    return incidentsRepository.list();
  },

  async acknowledgeIncident(actorUser, incidentId) {
    const updated = await withTransaction(async (client) => {
      const item = await incidentsRepository.acknowledge(incidentId, actorUser.sub, client);
      if (!item) {
        throw notFound('INCIDENT_NOT_FOUND', 'Инцидент не найден', 'Указанный инцидент уже обработан или отсутствует.');
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'admin.incident.acknowledge', target: incidentId, result: 'success', meta: { roomId: item.roomId, incidentType: item.incidentType } }, client);
      return item;
    });
    return updated;
  },


  async resolveIncident(actorUser, incidentId) {
    const updated = await withTransaction(async (client) => {
      const item = await incidentsRepository.resolve(incidentId, actorUser.sub, client);
      if (!item) {
        throw notFound('INCIDENT_NOT_FOUND', 'Инцидент не найден', 'Указанный инцидент уже закрыт или отсутствует.');
      }
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'admin.incident.resolve', target: incidentId, result: 'success', meta: { roomId: item.roomId, incidentType: item.incidentType } }, client);
      return item;
    });
    return updated;
  },

  async operatorAction(actorUser, roomId, payload) {
    const room = await ensureRoomExists(roomId);
    if (!['voice', 'meeting'].includes(room.kind)) {
      throw badRequest('ADMIN_OPERATOR_ROOM_KIND', 'Комната не поддерживает это действие', 'Операторские действия доступны только для голосовых комнат и комнат собраний.');
    }

    const entryModeMap = {
      set_entry_open: 'open',
      set_entry_knock: 'knock',
      set_entry_closed: 'closed'
    };
    const bulkMap = {
      mute_all: { isMuted: true },
      unmute_all: { isMuted: false },
      lower_all_hands: { handRaised: false },
      stop_all_screens: { screenActive: false },
      disconnect_all: { isConnected: false, isSpeaking: false, handRaised: false, screenActive: false }
    };

    return withTransaction(async (client) => {
      let result;
      if (entryModeMap[payload.action]) {
        result = await roomsRepository.setEntryMode(roomId, entryModeMap[payload.action], client);
      } else if (bulkMap[payload.action]) {
        const state = await voiceRepository.bulkPatchRoom(roomId, bulkMap[payload.action], client);
        result = { roomId, state };
        if (payload.action === 'disconnect_all') {
          await incidentsRepository.create({
            roomId,
            actorUserId: actorUser.sub,
            incidentType: 'disconnect_all',
            severity: 'warning',
            note: payload.note || 'Оператор выполнил массовое отключение всех участников.',
            meta: { roomKind: room.kind, source: 'operator_wallboard' }
          }, client);
        }
      } else {
        throw badRequest('ADMIN_OPERATOR_ACTION_INVALID', 'Некорректное операторское действие', 'Указано неподдерживаемое операторское действие.');
      }

      await auditRepository.create({ actorUserId: actorUser.sub, action: `admin.operator.${payload.action}`, target: roomId, result: 'success', meta: { roomId, roomKind: room.kind, note: payload.note || null } }, client);
      return { roomId, roomName: room.name, roomKind: room.kind, action: payload.action, result };
    });
  },

  async audit() {
    return auditRepository.list();
  },

  async users() {
    const [users, departments, invitations] = await Promise.all([
      profilesRepository.listUsersForAdmin(),
      profilesRepository.listDepartments(),
      authRepository.listInvitations()
    ]);
    return { users, departments, invitations };
  },

  async updateUser(actorUser, userId, payload) {
    const current = await ensureUserExists(userId);
    return withTransaction(async (client) => {
      const nextRole = payload.role === undefined ? current.role : payload.role;
      const nextStatus = payload.status === undefined ? current.status : payload.status;
      const nextIsActive = payload.isActive === undefined ? current.isActive : payload.isActive;

      await usersRepository.updateAdminFields(userId, {
        displayName: payload.displayName || undefined,
        role: nextRole,
        status: nextRole === 'blocked' || nextIsActive === false ? 'offline' : nextStatus,
        isActive: payload.isActive
      }, client);

      if ([payload.departmentId, payload.jobTitle, payload.phone, payload.about].some((item) => item !== undefined)) {
        await profilesRepository.upsertUserProfile({
          userId,
          displayName: payload.displayName || undefined,
          status: nextRole === 'blocked' || nextIsActive === false ? 'offline' : payload.status,
          departmentId: payload.departmentId,
          jobTitle: payload.jobTitle,
          phone: payload.phone,
          about: payload.about
        }, client);
      }

      if (payload.departmentId !== undefined) {
        await profilesRepository.setDepartmentForUser(userId, payload.departmentId || null, client);
      }

      if (nextRole === 'blocked' || nextIsActive === false) {
        await authRepository.revokeAllUserSessions(userId, {}, client);
      }

      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'admin.user.update',
        target: userId,
        result: 'success',
        meta: payload
      }, client);

      return profilesRepository.getUserProfile(userId);
    });
  },

  async revokeUserSessions(actorUser, userId) {
    await ensureUserExists(userId);
    await withTransaction(async (client) => {
      await authRepository.revokeAllUserSessions(userId, {}, client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'admin.user.revoke_sessions', target: userId, result: 'success' }, client);
    });
    return { ok: true };
  },

  async rolesMatrix() {
    return {
      roles: getMatrixView(),
      permissions: permissionsCatalog
    };
  },

  async sessions() {
    return authRepository.listAllSessions();
  },

  async rooms() {
    return roomsRepository.listForAdmin();
  },

  async createRoom(actorUser, payload) {
    return withTransaction(async (client) => {
      const room = await roomsRepository.create({ name: payload.name, kind: payload.kind, isPrivate: payload.isPrivate }, client);
      const memberIds = [...new Set([payload.ownerUserId, ...(payload.memberIds || []), ...(payload.moderatorIds || [])].filter(Boolean))];
      if (memberIds.length) {
        await roomsRepository.addMembers(room.id, memberIds, client);
      }

      if (payload.kind === 'voice' || payload.kind === 'meeting') {
        if (payload.ownerUserId) {
          await voiceRepository.upsertParticipant(room.id, payload.ownerUserId, { voiceRole: 'host', isConnected: false }, client);
        }
        for (const moderatorId of payload.moderatorIds || []) {
          if (moderatorId && moderatorId !== payload.ownerUserId) {
            await voiceRepository.upsertParticipant(room.id, moderatorId, { voiceRole: 'moderator', isConnected: false }, client);
          }
        }
      }

      if (payload.kind === 'meeting') {
        await meetingsRepository.ensureRoom(room.id, payload.ownerUserId || null, client);
        await meetingsRepository.update(room.id, { title: payload.name, hostUserId: payload.ownerUserId || null }, client);
      }

      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'admin.room.create',
        target: room.id,
        result: 'success',
        meta: payload
      }, client);

      return room;
    });
  },

  async archiveRoom(actorUser, roomId) {
    const room = await ensureRoomExists(roomId);
    if (room.isArchived) {
      throw badRequest('ROOM_ALREADY_ARCHIVED', 'Комната уже архивирована', 'Повторная архивация не требуется.');
    }
    const archived = await withTransaction(async (client) => {
      const result = await roomsRepository.setArchived(roomId, true, client);
      await auditRepository.create({ actorUserId: actorUser.sub, action: 'admin.room.archive', target: roomId, result: 'success' }, client);
      return result;
    });
    return archived;
  },

  async departments() {
    return profilesRepository.listDepartments();
  },

  async createDepartment(actorUser, payload) {
    return withTransaction(async (client) => {
      const department = await profilesRepository.createDepartment(payload, client);
      if (payload.leaderUserId) {
        await profilesRepository.setDepartmentForUser(payload.leaderUserId, department.id, client);
      }

      if (payload.createBaseRooms) {
        const rooms = [
          { name: `${payload.name} · общий контур`, kind: 'group' },
          { name: `${payload.name} · голосовой контур`, kind: 'voice' },
          { name: `${payload.name} · собрания`, kind: 'meeting' }
        ];
        for (const item of rooms) {
          const room = await roomsRepository.create({ name: item.name, kind: item.kind, isPrivate: false }, client);
          if (payload.leaderUserId) {
            await roomsRepository.addMembers(room.id, [payload.leaderUserId], client);
            if (item.kind === 'voice' || item.kind === 'meeting') {
              await voiceRepository.upsertParticipant(room.id, payload.leaderUserId, { voiceRole: 'host', isConnected: false }, client);
            }
            if (item.kind === 'meeting') {
              await meetingsRepository.ensureRoom(room.id, payload.leaderUserId, client);
              await meetingsRepository.update(room.id, { title: item.name, hostUserId: payload.leaderUserId }, client);
            }
          }
        }
      }

      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'admin.department.create',
        target: department.id,
        result: 'success',
        meta: payload
      }, client);

      return department;
    });
  },

  async invitations() {
    return authRepository.listInvitations();
  },

  async createInvitation(actorUser, payload) {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + Math.max(1, payload.expiresDays || 14) * 86400000).toISOString();
    const invitation = await withTransaction(async (client) => {
      const created = await authRepository.createInvitation({
        email: payload.email,
        role: payload.role,
        invitedByUserId: actorUser.sub,
        token,
        note: payload.note,
        expiresAt
      }, client);
      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'admin.invitation.create',
        target: created.id,
        result: 'success',
        meta: { email: payload.email, role: payload.role }
      }, client);
      return created;
    });

    return {
      ...invitation,
      token,
      inviteLink: demoInviteLink(token)
    };
  },

  async system() {
    return systemRepository.getRuntimeConfig();
  },

  async announcement() {
    return systemRepository.getAnnouncement();
  },

  async updateAnnouncement(actorUser, payload) {
    return withTransaction(async (client) => {
      const updated = await systemRepository.upsertAnnouncement(payload, client);
      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'admin.announcement.update',
        target: 'announcement',
        result: 'success',
        meta: payload
      }, client);
      return updated;
    });
  },

  async clearAnnouncement(actorUser) {
    return withTransaction(async (client) => {
      const updated = await systemRepository.clearAnnouncement(client);
      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'admin.announcement.clear',
        target: 'announcement',
        result: 'success'
      }, client);
      return updated;
    });
  },

  async updateSystem(actorUser, payload) {
    return withTransaction(async (client) => {
      const updated = await systemRepository.upsertBranding(payload, client);
      await auditRepository.create({
        actorUserId: actorUser.sub,
        action: 'admin.system.update',
        target: 'branding',
        result: 'success',
        meta: payload
      }, client);
      return updated;
    });
  }
};
