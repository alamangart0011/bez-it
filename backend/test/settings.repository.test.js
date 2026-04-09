import test from 'node:test';
import assert from 'node:assert/strict';

import { settingsRepository } from '../src/repositories/settings.repository.js';

function createClientDouble(sequence) {
  const calls = [];
  let index = 0;
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      const next = sequence[index++] ?? { rows: [] };
      return typeof next === 'function' ? next(sql, params) : next;
    }
  };
}

test('getByUserId returns defaults when DB has no row', async () => {
  const client = createClientDouble([{ rows: [] }]);
  const result = await settingsRepository.getByUserId('user-1', client);

  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].params[0], 'user-1');
  assert.deepEqual(result, {
    userId: 'user-1',
    theme: 'dark',
    notificationsEnabled: true,
    soundEnabled: true,
    desktopNotifications: true,
    compactMode: false,
    enterToSend: true,
    pushToTalk: false,
    voiceInputDevice: null,
    voiceOutputDevice: null,
    fontScale: 'normal',
    highContrast: false,
    reduceMotion: false,
    updatedAt: null
  });
});

test('upsert merges payload with defaults and reads back through same client', async () => {
  const storedRow = {
    userId: 'user-77',
    theme: 'light',
    notificationsEnabled: false,
    soundEnabled: true,
    desktopNotifications: true,
    compactMode: true,
    enterToSend: true,
    pushToTalk: false,
    voiceInputDevice: null,
    voiceOutputDevice: null,
    fontScale: 'normal',
    highContrast: false,
    reduceMotion: false,
    updatedAt: '2026-04-09T05:41:51.000Z'
  };

  const client = createClientDouble([
    { rows: [] },
    { rows: [storedRow] }
  ]);

  const result = await settingsRepository.upsert(
    'user-77',
    { theme: 'light', notificationsEnabled: false, compactMode: true },
    client
  );

  assert.equal(client.calls.length, 2);
  assert.match(client.calls[0].sql, /insert into user_settings/i);
  assert.deepEqual(client.calls[0].params, [
    'user-77',
    'light',
    false,
    true,
    true,
    true,
    true,
    false,
    null,
    null,
    'normal',
    false,
    false
  ]);
  assert.match(client.calls[1].sql, /from user_settings/i);
  assert.equal(client.calls[1].params[0], 'user-77');
  assert.deepEqual(result, storedRow);
});
