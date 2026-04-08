import { badRequest } from '../lib/errors.js';

const statuses = new Set(['planned', 'active', 'closed']);
const eventTypes = new Set(['note', 'decision', 'action', 'start', 'finish']);
const meetingActions = new Set(['open_meeting', 'close_meeting', 'mute_all', 'lower_all_hands', 'stop_all_screens']);

function normalize(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function validateMeetingPatchPayload(body) {
  const status = body?.status ? normalize(body.status) : undefined;
  if (status && !statuses.has(status)) {
    throw badRequest('MEETING_STATUS_INVALID', 'Некорректный статус собрания', 'Допустимы статусы: planned, active, closed.');
  }
  return {
    title: body?.title === undefined ? undefined : normalize(body.title),
    agenda: body?.agenda === undefined ? undefined : normalize(body.agenda),
    summary: body?.summary === undefined ? undefined : normalize(body.summary),
    hostUserId: body?.hostUserId === undefined ? undefined : normalize(body.hostUserId),
    status
  };
}

export function validateMeetingEventPayload(body) {
  const eventType = normalize(body?.eventType) || 'note';
  const bodyText = normalize(body?.body);
  if (!eventTypes.has(eventType)) {
    throw badRequest('MEETING_EVENT_INVALID', 'Некорректный тип события', 'Используйте note, decision, action, start или finish.');
  }
  if (!bodyText) {
    throw badRequest('MEETING_EVENT_BODY_REQUIRED', 'Пустое событие', 'Введите описание события собрания.');
  }
  return { eventType, body: bodyText };
}


export function validateMeetingActionPayload(body) {
  const action = normalize(body?.action);
  const note = normalize(body?.note);
  if (!action || !meetingActions.has(action)) {
    throw badRequest('MEETING_ACTION_INVALID', 'Некорректное быстрое действие', 'Используйте open_meeting, close_meeting, mute_all, lower_all_hands или stop_all_screens.');
  }
  return { action, note };
}
