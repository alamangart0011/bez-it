import { badRequest } from '../lib/errors.js';

export function validateSendMessagePayload(body) {
  const text = String(body?.text ?? body?.content ?? '').trim();
  const replyToMessageId = body?.replyToMessageId ? String(body.replyToMessageId) : null;
  if (!text) throw badRequest('MESSAGE_EMPTY', 'Пустое сообщение', 'Введите текст сообщения.');
  return { text, replyToMessageId };
}

export function validateEditMessagePayload(body) {
  const text = String(body?.text ?? body?.content ?? '').trim();
  if (!text) throw badRequest('MESSAGE_EMPTY', 'Пустое сообщение', 'Введите текст сообщения.');
  return { text };
}

export function validateRoomSearchQuery(query) {
  const q = String(query?.q || '').trim();
  if (!q) throw badRequest('SEARCH_QUERY_REQUIRED', 'Пустой поисковый запрос', 'Введите текст для поиска по сообщениям комнаты.');
  return q;
}
