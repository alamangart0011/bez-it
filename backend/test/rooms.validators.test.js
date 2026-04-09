import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateSendMessagePayload,
  validateEditMessagePayload,
  validateRoomSearchQuery
} from '../src/validators/rooms.validators.js';
import { AppError } from '../src/lib/errors.js';

function assertAppError(error, expectedCode) {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, expectedCode);
}

test('validateSendMessagePayload trims text and preserves reply id', () => {
  const result = validateSendMessagePayload({ text: '  Привет  ', replyToMessageId: 42 });
  assert.deepEqual(result, { text: 'Привет', replyToMessageId: '42' });
});

test('validateSendMessagePayload supports content alias', () => {
  const result = validateSendMessagePayload({ content: '  Через content  ' });
  assert.deepEqual(result, { text: 'Через content', replyToMessageId: null });
});

test('validateSendMessagePayload rejects empty payload', () => {
  assert.throws(() => validateSendMessagePayload({ text: '   ' }), (error) => {
    assertAppError(error, 'MESSAGE_EMPTY');
    return true;
  });
});

test('validateEditMessagePayload trims text', () => {
  const result = validateEditMessagePayload({ content: '  Новый текст  ' });
  assert.deepEqual(result, { text: 'Новый текст' });
});

test('validateEditMessagePayload rejects empty text', () => {
  assert.throws(() => validateEditMessagePayload({ text: '' }), (error) => {
    assertAppError(error, 'MESSAGE_EMPTY');
    return true;
  });
});

test('validateRoomSearchQuery returns trimmed query', () => {
  const result = validateRoomSearchQuery({ q: '  релиз  ' });
  assert.equal(result, 'релиз');
});

test('validateRoomSearchQuery rejects empty query', () => {
  assert.throws(() => validateRoomSearchQuery({ q: '   ' }), (error) => {
    assertAppError(error, 'SEARCH_QUERY_REQUIRED');
    return true;
  });
});
