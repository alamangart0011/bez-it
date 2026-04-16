import { badRequest } from '../lib/errors.js';

export function validateSendMessagePayload(body) {
  const text = String(body?.content || '').trim();
  const replyToMessageId = body?.replyToMessageId ? String(body.replyToMessageId) : null;
  if (!text) throw badRequest('MESSAGE_EMPTY', 'Пустое сообщение', 'Введите текст сообщения.');
  return { text, replyToMessageId };
}

export function validateEditMessagePayload(body) {
  const text = String(body?.content || '').trim();
  if (!text) throw badRequest('MESSAGE_EMPTY', 'Пустое сообщение', 'Введите новый текст сообщения.');
  return { text };
}

const allowedRoomKinds = new Set(['group', 'voice', 'meeting']);

export function validateCreateRoomPayload(body) {
  const name = String(body?.name || '').trim();
  const kind = String(body?.kind || 'group').trim();
  if (!name) throw badRequest('ROOM_NAME_REQUIRED', 'Нужно название комнаты', 'Укажите название комнаты.');
  if (!allowedRoomKinds.has(kind)) {
    throw badRequest('ROOM_KIND_INVALID', 'Некорректный тип комнаты', 'Указан неподдерживаемый тип комнаты.');
  }
  return { name, kind };
}

export function validateRoomSearchQuery(query) {
  const q = String(query?.q || '').trim();
  if (!q) throw badRequest('SEARCH_QUERY_REQUIRED', 'Пустой поисковый запрос', 'Введите текст для поиска по сообщениям комнаты.');
  return q;
}
