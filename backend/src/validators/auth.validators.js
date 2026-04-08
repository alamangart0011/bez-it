import { badRequest } from '../lib/errors.js';

function requireString(value, code, title, message) {
  const normalized = String(value || '').trim();
  if (!normalized) throw badRequest(code, title, message);
  return normalized;
}

export function validateLoginPayload(body) {
  const login = requireString(body?.login, 'LOGIN_REQUIRED', 'Нужны учётные данные', 'Укажите логин и пароль.');
  const password = String(body?.password || '');
  if (!password) {
    throw badRequest('LOGIN_REQUIRED', 'Нужны учётные данные', 'Укажите логин и пароль.');
  }
  return { login, password };
}

export function validateRefreshPayload(body) {
  const refreshToken = requireString(body?.refreshToken, 'REFRESH_REQUIRED', 'Нужен токен обновления', 'Передайте refreshToken.');
  return { refreshToken };
}

export function validatePasswordChangePayload(body) {
  const currentPassword = String(body?.currentPassword || '');
  const newPassword = String(body?.newPassword || '');
  if (!currentPassword || !newPassword) {
    throw badRequest('PASSWORD_REQUIRED', 'Нужно заполнить пароли', 'Укажите текущий и новый пароль.');
  }
  return { currentPassword, newPassword };
}

export function validateForgotPasswordPayload(body) {
  return { email: requireString(body?.email, 'EMAIL_REQUIRED', 'Нужна рабочая почта', 'Укажите рабочую почту сотрудника.') };
}

export function validateResetPasswordPayload(body) {
  const token = requireString(body?.token, 'RESET_TOKEN_REQUIRED', 'Нужен код восстановления', 'Передайте токен восстановления доступа.');
  const newPassword = String(body?.newPassword || '');
  const confirmPassword = String(body?.confirmPassword || '');
  if (!newPassword || !confirmPassword) {
    throw badRequest('PASSWORD_REQUIRED', 'Нужно заполнить пароль', 'Укажите новый пароль и подтверждение.');
  }
  return { token, newPassword, confirmPassword };
}

export function validateInvitationPreview(body, params) {
  const token = requireString((body && body.token) || (params && params.token), 'INVITE_TOKEN_REQUIRED', 'Нужен токен приглашения', 'Передайте ссылку или код приглашения.');
  return { token };
}

export function validateInvitationAcceptPayload(body) {
  const token = requireString(body?.token, 'INVITE_TOKEN_REQUIRED', 'Нужен токен приглашения', 'Передайте ссылку или код приглашения.');
  const displayName = requireString(body?.displayName, 'DISPLAY_NAME_REQUIRED', 'Нужно имя сотрудника', 'Укажите ФИО сотрудника.');
  const username = requireString(body?.username, 'USERNAME_REQUIRED', 'Нужен логин', 'Укажите корпоративный логин.');
  const password = String(body?.password || '');
  const confirmPassword = String(body?.confirmPassword || '');
  if (!password || !confirmPassword) {
    throw badRequest('PASSWORD_REQUIRED', 'Нужно задать пароль', 'Укажите пароль и подтверждение.');
  }
  return { token, displayName, username, password, confirmPassword };
}

export function validateSessionRevokePayload(body, params) {
  const sessionId = requireString((params && params.sessionId) || (body && body.sessionId), 'SESSION_ID_REQUIRED', 'Нужна сессия', 'Укажите идентификатор сессии.');
  return { sessionId };
}
