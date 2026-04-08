import crypto from 'crypto';
import { withTransaction } from '../db/pg.js';
import { usersRepository } from '../repositories/users.repository.js';
import { authRepository } from '../repositories/auth.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { roomsRepository } from '../repositories/rooms.repository.js';
import { jwtUtil } from '../lib/jwt.js';
import { verifyPassword, hashPassword } from '../lib/password.js';
import { badRequest, conflict, notFound, unauthorized } from '../lib/errors.js';

function buildTokenPayload(user, sessionId) {
  return {
    sub: user.id,
    sid: sessionId,
    role: user.role,
    email: user.email,
    displayName: user.displayName
  };
}

function buildUserView(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

function refreshExpiryDate() {
  return new Date(Date.now() + Number(process.env.REFRESH_TOKEN_TTL_SEC || 2592000) * 1000);
}

function resetExpiryDate() {
  return new Date(Date.now() + 1000 * 60 * 30);
}

function invitationExpiryDate() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
}

function createOpaqueToken(prefix = '') {
  return `${prefix}${crypto.randomBytes(24).toString('hex')}`;
}

function normalizePasswordPair(newPassword, confirmPassword) {
  if (!newPassword || newPassword.length < 10) {
    throw badRequest('PASSWORD_INVALID', 'Некорректный пароль', 'Новый пароль должен содержать не менее 10 символов.');
  }
  if (newPassword !== confirmPassword) {
    throw badRequest('PASSWORD_MISMATCH', 'Пароли не совпадают', 'Повторите ввод нового пароля.');
  }
}

export const authService = {
  async login({ login, password, userAgent, ipAddress }) {
    if (!login || !password) {
      throw badRequest('LOGIN_REQUIRED', 'Нужны учётные данные', 'Укажите логин и пароль.');
    }

    const user = await usersRepository.findByLogin(login);
    if (!user || !user.passwordHash || !user.isActive) {
      throw unauthorized('INVALID_CREDENTIALS', 'Неверный логин или пароль', 'Проверьте логин и пароль.');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await auditRepository.create({ actorUserId: user.id, action: 'auth.login', target: user.email, result: 'denied', meta: { userAgent, ipAddress } });
      throw unauthorized('INVALID_CREDENTIALS', 'Неверный логин или пароль', 'Проверьте логин и пароль.');
    }

    const sessionId = crypto.randomUUID();
    const payload = buildTokenPayload(user, sessionId);
    const accessToken = jwtUtil.signAccess(payload);
    const refreshToken = jwtUtil.signRefresh(payload);
    await authRepository.createSession({ id: sessionId, userId: user.id, refreshToken, userAgent, ipAddress, expiresAt: refreshExpiryDate() });
    await auditRepository.create({ actorUserId: user.id, action: 'auth.login', target: user.email, result: 'success', meta: { userAgent, ipAddress, sessionId } });

    return { accessToken, refreshToken, sessionId, user: buildUserView(user) };
  },

  async refresh({ refreshToken, userAgent, ipAddress }) {
    if (!refreshToken) {
      throw unauthorized('REFRESH_REQUIRED', 'Нужна сессия', 'Передайте токен обновления.');
    }

    const payload = jwtUtil.verifyRefresh(refreshToken);
    const session = await authRepository.findValidSessionByToken(refreshToken);
    if (!session) {
      throw unauthorized('REFRESH_INVALID', 'Сессия истекла', 'Токен обновления больше не действителен.');
    }

    const user = await usersRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw unauthorized('USER_INACTIVE', 'Пользователь недоступен', 'Учётная запись отключена.');
    }

    await authRepository.revokeSession(session.id);
    const nextSessionId = crypto.randomUUID();
    const nextPayload = buildTokenPayload(user, nextSessionId);
    const accessToken = jwtUtil.signAccess(nextPayload);
    const nextRefreshToken = jwtUtil.signRefresh(nextPayload);
    await authRepository.createSession({ id: nextSessionId, userId: user.id, refreshToken: nextRefreshToken, userAgent, ipAddress, expiresAt: refreshExpiryDate() });
    await auditRepository.create({ actorUserId: user.id, action: 'auth.refresh', target: user.email, result: 'success', meta: { userAgent, ipAddress, previousSessionId: session.id, sessionId: nextSessionId } });

    return { accessToken, refreshToken: nextRefreshToken, sessionId: nextSessionId, user: buildUserView(user) };
  },

  async logout({ refreshToken, actorUserId = null, actorSessionId = null }) {
    if (refreshToken) {
      const session = await authRepository.findValidSessionByToken(refreshToken);
      if (session) {
        await authRepository.revokeSession(session.id);
      }
    } else if (actorSessionId) {
      await authRepository.revokeUserSession(actorSessionId, actorUserId);
    }
    await auditRepository.create({ actorUserId, action: 'auth.logout', target: actorUserId, result: 'success', meta: { sessionId: actorSessionId || null } });
    return { ok: true };
  },

  async logoutAll({ actorUserId, actorSessionId = null, excludeCurrent = false }) {
    await authRepository.revokeAllUserSessions(actorUserId, excludeCurrent ? { exceptSessionId: actorSessionId } : {});
    await auditRepository.create({ actorUserId, action: excludeCurrent ? 'auth.logout_others' : 'auth.logout_all', target: actorUserId, result: 'success', meta: { actorSessionId } });
    return { ok: true };
  },

  async listSessions({ actorUserId, actorSessionId }) {
    const sessions = await authRepository.listUserSessions(actorUserId);
    const history = await auditRepository.listAuthEvents(actorUserId, 15);
    return {
      currentSessionId: actorSessionId,
      sessions: sessions.map((session) => ({
        ...session,
        isCurrent: session.id === actorSessionId,
        isRevoked: Boolean(session.revokedAt),
        isExpired: Boolean(session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now())
      })),
      history
    };
  },

  async revokeSession({ actorUserId, actorSessionId, sessionId }) {
    const session = await authRepository.findActiveSessionById(sessionId);
    if (!session || session.userId !== actorUserId) {
      throw notFound('SESSION_NOT_FOUND', 'Сессия не найдена', 'Не удалось найти указанную активную сессию.');
    }
    await authRepository.revokeUserSession(sessionId, actorUserId);
    await auditRepository.create({ actorUserId, action: 'auth.session_revoke', target: sessionId, result: 'success', meta: { actorSessionId } });
    return { ok: true };
  },

  async changePassword({ actorUserId, actorSessionId, currentPassword, newPassword }) {
    if (!currentPassword || !newPassword || newPassword.length < 10) {
      throw badRequest('PASSWORD_INVALID', 'Некорректный пароль', 'Новый пароль должен содержать не менее 10 символов.');
    }

    const user = await usersRepository.findById(actorUserId);
    if (!user) {
      throw unauthorized('USER_NOT_FOUND', 'Пользователь не найден', 'Повторите вход в систему.');
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash || '');
    if (!valid) {
      throw unauthorized('INVALID_CREDENTIALS', 'Текущий пароль неверен', 'Проверьте текущий пароль.');
    }

    const passwordHash = await hashPassword(newPassword);
    await withTransaction(async (client) => {
      await usersRepository.updatePassword(actorUserId, passwordHash, client);
      await authRepository.invalidatePasswordResetTokens(actorUserId, client);
      await authRepository.revokeAllUserSessions(actorUserId, { exceptSessionId: actorSessionId }, client);
      await auditRepository.create({ actorUserId, action: 'auth.password_change', target: actorUserId, result: 'success', meta: { actorSessionId } }, client);
    });
    return { ok: true };
  },

  async forgotPassword({ email }) {
    const user = await usersRepository.findByEmail(email);
    if (!user || !user.isActive) {
      return { ok: true, delivery: 'silent' };
    }

    const token = createOpaqueToken('reset_');
    await withTransaction(async (client) => {
      await authRepository.invalidatePasswordResetTokens(user.id, client);
      await authRepository.createPasswordResetToken({ userId: user.id, token, expiresAt: resetExpiryDate() }, client);
      await auditRepository.create({ actorUserId: user.id, action: 'auth.password_reset_request', target: user.email, result: 'success' }, client);
    });

    return {
      ok: true,
      delivery: 'service_token',
      resetToken: token,
      resetPath: `/reset-password?token=${encodeURIComponent(token)}`,
      expiresInMinutes: 30
    };
  },

  async resetPassword({ token, newPassword, confirmPassword }) {
    normalizePasswordPair(newPassword, confirmPassword);
    const resetToken = await authRepository.findValidPasswordResetToken(token);
    if (!resetToken) {
      throw unauthorized('RESET_TOKEN_INVALID', 'Код восстановления недействителен', 'Запросите новый код восстановления доступа.');
    }

    const user = await usersRepository.findById(resetToken.userId);
    if (!user || !user.isActive) {
      throw unauthorized('USER_INACTIVE', 'Пользователь недоступен', 'Учётная запись отключена.');
    }

    const passwordHash = await hashPassword(newPassword);
    await withTransaction(async (client) => {
      await usersRepository.updatePassword(user.id, passwordHash, client);
      await authRepository.markPasswordResetTokenUsed(resetToken.id, client);
      await authRepository.invalidatePasswordResetTokens(user.id, client);
      await authRepository.revokeAllUserSessions(user.id, {}, client);
      await auditRepository.create({ actorUserId: user.id, action: 'auth.password_reset_complete', target: user.email, result: 'success' }, client);
    });

    return { ok: true };
  },

  async previewInvitation({ token }) {
    const invitation = await authRepository.findValidInvitation(token);
    if (!invitation) {
      throw notFound('INVITATION_NOT_FOUND', 'Приглашение недействительно', 'Ссылка приглашения истекла или уже использована.');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      note: invitation.note
    };
  },

  async acceptInvitation({ token, displayName, username, password, confirmPassword, userAgent, ipAddress }) {
    normalizePasswordPair(password, confirmPassword);

    const invitation = await authRepository.findValidInvitation(token);
    if (!invitation) {
      throw notFound('INVITATION_NOT_FOUND', 'Приглашение недействительно', 'Ссылка приглашения истекла или уже использована.');
    }

    const existsByEmail = await usersRepository.findByEmail(invitation.email);
    if (existsByEmail) {
      throw conflict('EMAIL_EXISTS', 'Учётная запись уже создана', 'Для этой рабочей почты уже существует сотрудник. Выполните обычный вход.');
    }
    const existsByUsername = await usersRepository.findByUsername(username);
    if (existsByUsername) {
      throw conflict('USERNAME_EXISTS', 'Логин уже занят', 'Выберите другой корпоративный логин.');
    }

    const passwordHash = await hashPassword(password);
    const user = await withTransaction(async (client) => {
      const createdUser = await usersRepository.createUser({
        displayName,
        username,
        email: invitation.email,
        role: invitation.role,
        status: 'online',
        isActive: true,
        passwordHash
      }, client);
      await authRepository.markInvitationAccepted(invitation.id, createdUser.id, client);
      await roomsRepository.addUserToDefaultRooms(createdUser.id, client);
      await auditRepository.create({ actorUserId: createdUser.id, action: 'auth.invitation_accept', target: invitation.email, result: 'success', meta: { invitedByUserId: invitation.invitedByUserId } }, client);
      return createdUser;
    });

    const sessionId = crypto.randomUUID();
    const payload = buildTokenPayload(user, sessionId);
    const accessToken = jwtUtil.signAccess(payload);
    const refreshToken = jwtUtil.signRefresh(payload);
    await authRepository.createSession({ id: sessionId, userId: user.id, refreshToken, userAgent, ipAddress, expiresAt: refreshExpiryDate() });
    await auditRepository.create({ actorUserId: user.id, action: 'auth.login', target: user.email, result: 'success', meta: { userAgent, ipAddress, sessionId, source: 'invitation' } });

    return { accessToken, refreshToken, sessionId, user: buildUserView(user) };
  },

  async createInvitationForSeed({ email, role = 'member', invitedByUserId = null, note = null }) {
    const token = createOpaqueToken('invite_');
    const invitation = await authRepository.createInvitation({ email, role, invitedByUserId, token, expiresAt: invitationExpiryDate(), note });
    return { ...invitation, token };
  }
};
