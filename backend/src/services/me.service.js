import { withTransaction } from '../db/pg.js';
import { notFound } from '../lib/errors.js';
import { profilesRepository } from '../repositories/profiles.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { roomsRepository } from '../repositories/rooms.repository.js';
import { authRepository } from '../repositories/auth.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { getRolePermissions, roleLabels } from '../lib/permissions.js';
import { systemRepository } from '../repositories/system.repository.js';

export const meService = {
  async getMe(user) {
    const entity = await profilesRepository.getUserProfile(user.sub);
    if (!entity) throw notFound('USER_NOT_FOUND', 'Пользователь не найден', 'Не удалось получить профиль текущего пользователя.');

    const [settings, sessions, rooms, history, system] = await Promise.all([
      settingsRepository.getByUserId(user.sub),
      authRepository.listUserSessions(user.sub),
      roomsRepository.listForUser(user.sub),
      auditRepository.listAuthEvents(user.sub, 10),
      systemRepository.getRuntimeConfig()
    ]);

    return {
      ...entity,
      roleLabel: roleLabels[entity.role] || entity.role,
      permissions: getRolePermissions(entity.role),
      rooms,
      activeSessions: sessions.filter((item) => !item.revokedAt && new Date(item.expiresAt).getTime() > Date.now()).length,
      sessionHistory: history,
      settings,
      system
    };
  },

  async updateProfile(user, payload) {
    const entity = await profilesRepository.getUserProfile(user.sub);
    if (!entity) throw notFound('USER_NOT_FOUND', 'Пользователь не найден', 'Не удалось обновить профиль текущего пользователя.');

    const updated = await withTransaction(async (client) => {
      const profile = await profilesRepository.upsertUserProfile({ userId: user.sub, ...payload }, client);
      await auditRepository.create({ actorUserId: user.sub, action: 'profile.update', target: user.sub, result: 'success', meta: payload }, client);
      return profile;
    });

    return {
      ...updated,
      roleLabel: roleLabels[updated.role] || updated.role,
      permissions: getRolePermissions(updated.role),
      rooms: await roomsRepository.listForUser(user.sub),
      settings: await settingsRepository.getByUserId(user.sub),
      system: await systemRepository.getRuntimeConfig()
    };
  },

  async getSettings(user) {
    return settingsRepository.getByUserId(user.sub);
  },

  async updateSettings(user, payload) {
    const settings = await withTransaction(async (client) => {
      const result = await settingsRepository.upsert(user.sub, payload, client);
      await auditRepository.create({ actorUserId: user.sub, action: 'settings.update', target: user.sub, result: 'success', meta: payload }, client);
      return result;
    });
    return settings;
  }
};
