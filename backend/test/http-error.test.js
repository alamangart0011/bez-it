import test from 'node:test';
import assert from 'node:assert/strict';

import { sendError } from '../src/lib/http-error.js';
import { badRequest } from '../src/lib/errors.js';

function createResponseDouble() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test('sendError serializes AppError consistently', () => {
  const res = createResponseDouble();
  const error = badRequest('MESSAGE_EMPTY', 'Пустое сообщение', 'Введите текст сообщения.');

  sendError(res, error);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, {
    code: 'MESSAGE_EMPTY',
    title: 'Пустое сообщение',
    message: 'Введите текст сообщения.',
    details: undefined
  });
});

test('sendError falls back to internal error envelope for unknown exceptions', () => {
  const res = createResponseDouble();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    sendError(res, new Error('boom'));
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.payload, {
    code: 'INTERNAL_ERROR',
    title: 'Внутренняя ошибка',
    message: 'Система не смогла завершить операцию. Повторите попытку позже.'
  });
});
