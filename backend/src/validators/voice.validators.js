import { badRequest } from '../lib/errors.js';

const moderationActions = new Set([
  'mute','unmute','deafen','undeafen','hand_up','hand_down','remove','ban_voice','unban_voice','make_moderator','remove_moderator','assign_host','move_to_room'
]);
const bulkActions = new Set(['mute_all','unmute_all','lower_all_hands','disconnect_all','stop_all_screens']);
const requestReviewStatuses = new Set(['approved','denied']);
const entryModes = new Set(['open','knock','closed']);

function asBoolean(value, fallback = false) {
  return value === undefined ? fallback : Boolean(value);
}

export function validateVoiceSelfPayload(body) {
  return {
    isMuted: body?.isMuted === undefined ? undefined : Boolean(body.isMuted),
    isDeafened: body?.isDeafened === undefined ? undefined : Boolean(body.isDeafened),
    handRaised: body?.handRaised === undefined ? undefined : Boolean(body.handRaised),
    screenActive: body?.screenActive === undefined ? undefined : Boolean(body.screenActive),
    isSpeaking: body?.isSpeaking === undefined ? undefined : Boolean(body.isSpeaking)
  };
}

export function validateVoiceJoinPayload(body) {
  return {
    isMuted: asBoolean(body?.isMuted, false),
    isDeafened: asBoolean(body?.isDeafened, false),
    handRaised: asBoolean(body?.handRaised, false),
    screenActive: asBoolean(body?.screenActive, false)
  };
}

export function validateVoiceModerationPayload(body) {
  const action = String(body?.action || '').trim();
  const targetUserId = String(body?.targetUserId || '').trim();
  const targetRoomId = body?.targetRoomId ? String(body.targetRoomId).trim() : null;
  if (!action || !moderationActions.has(action)) {
    throw badRequest('VOICE_ACTION_INVALID', 'Некорректное действие', 'Укажите допустимое действие модерации голоса.');
  }
  if (!targetUserId) {
    throw badRequest('VOICE_TARGET_REQUIRED', 'Не выбран сотрудник', 'Укажите сотрудника для действия модерации.');
  }
  if (action === 'move_to_room' && !targetRoomId) {
    throw badRequest('VOICE_TARGET_ROOM_REQUIRED', 'Не выбрана комната', 'Для переноса нужно указать целевую комнату.');
  }
  return { action, targetUserId, targetRoomId };
}

export function validateVoiceSummonPayload(body = {}) {
  return {
    targetUserId: String(body.targetUserId || '').trim(),
    note: body.note == null ? '' : String(body.note).slice(0, 220)
  };
}

export function validateVoiceSummonManyPayload(body = {}) {
  const userIds = Array.isArray(body.userIds) ? [...new Set(body.userIds.map((item) => String(item || '').trim()).filter(Boolean))] : [];
  if (!userIds.length) {
    throw badRequest('VOICE_SUMMON_TARGETS_REQUIRED', 'Не выбраны сотрудники', 'Укажите хотя бы одного сотрудника для вызова в комнату.');
  }
  return {
    userIds,
    note: body.note == null ? '' : String(body.note).slice(0, 220)
  };
}

export function validateVoiceBulkPayload(body = {}) {
  const action = String(body.action || '').trim();
  if (!bulkActions.has(action)) {
    throw badRequest('VOICE_BULK_ACTION_INVALID', 'Некорректное массовое действие', 'Поддерживаются mute_all, unmute_all, lower_all_hands, disconnect_all, stop_all_screens.');
  }
  return { action, note: body.note == null ? '' : String(body.note).slice(0, 220) };
}


export function validateVoiceRequestPayload(body = {}) {
  return { note: body.note == null ? '' : String(body.note).slice(0, 220) };
}

export function validateVoiceReviewPayload(body = {}) {
  const requestId = String(body.requestId || '').trim();
  const status = String(body.status || '').trim();
  if (!requestId) {
    throw badRequest('VOICE_REQUEST_ID_REQUIRED', 'Не выбрана заявка', 'Укажите заявку на вход в голосовую комнату.');
  }
  if (!requestReviewStatuses.has(status)) {
    throw badRequest('VOICE_REQUEST_STATUS_INVALID', 'Некорректное решение', 'Поддерживаются решения approved и denied.');
  }
  return { requestId, status };
}

export function validateVoiceAccessPayload(body = {}) {
  const entryMode = String(body.entryMode || '').trim();
  if (!entryModes.has(entryMode)) {
    throw badRequest('VOICE_ENTRY_MODE_INVALID', 'Некорректный режим входа', 'Поддерживаются режимы open, knock и closed.');
  }
  return { entryMode };
}
