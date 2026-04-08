import { badRequest } from '../lib/errors.js';

const allowedStatuses = new Set(['online', 'away', 'busy', 'offline']);
const allowedThemes = new Set(['dark', 'light', 'system']);
const allowedFontScale = new Set(['small', 'normal', 'large']);

function normalizeString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

export function validateProfileUpdatePayload(body) {
  const displayName = normalizeString(body?.displayName);
  const jobTitle = normalizeString(body?.jobTitle);
  const phone = normalizeString(body?.phone);
  const about = normalizeString(body?.about);
  const photoUrl = normalizeString(body?.photoUrl);
  const departmentId = normalizeString(body?.departmentId);
  const status = normalizeString(body?.status);

  if (!displayName) {
    throw badRequest('DISPLAY_NAME_REQUIRED', 'Нужно имя сотрудника', 'Укажите ФИО сотрудника.');
  }
  if (status && !allowedStatuses.has(status)) {
    throw badRequest('STATUS_INVALID', 'Некорректный статус', 'Допустимы статусы: online, away, busy, offline.');
  }

  return { displayName, jobTitle, phone, about, photoUrl, departmentId, status };
}

export function validateSettingsPayload(body) {
  const payload = {
    theme: normalizeString(body?.theme) || 'dark',
    notificationsEnabled: Boolean(body?.notificationsEnabled),
    soundEnabled: Boolean(body?.soundEnabled),
    desktopNotifications: Boolean(body?.desktopNotifications),
    compactMode: Boolean(body?.compactMode),
    enterToSend: body?.enterToSend !== false,
    pushToTalk: Boolean(body?.pushToTalk),
    voiceInputDevice: normalizeString(body?.voiceInputDevice),
    voiceOutputDevice: normalizeString(body?.voiceOutputDevice),
    fontScale: normalizeString(body?.fontScale) || 'normal',
    highContrast: Boolean(body?.highContrast),
    reduceMotion: Boolean(body?.reduceMotion)
  };

  if (!allowedThemes.has(payload.theme)) {
    throw badRequest('THEME_INVALID', 'Некорректная тема', 'Допустимы значения: dark, light, system.');
  }
  if (!allowedFontScale.has(payload.fontScale)) {
    throw badRequest('FONT_SCALE_INVALID', 'Некорректный масштаб шрифта', 'Допустимы значения: small, normal, large.');
  }

  return payload;
}
