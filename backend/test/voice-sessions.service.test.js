import test from 'node:test';
import assert from 'node:assert/strict';

import { voiceSessionsService } from '../src/services/voice-sessions.service.js';
import { voiceSessionsRepository } from '../src/repositories/voice-sessions.repository.js';
import { AppError } from '../src/lib/errors.js';

function assertAppError(error, expectedCode) {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, expectedCode);
}

async function withPatchedRepo(methods, fn) {
  const original = {};
  for (const [key, value] of Object.entries(methods)) {
    original[key] = voiceSessionsRepository[key];
    voiceSessionsRepository[key] = value;
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      voiceSessionsRepository[key] = value;
    }
  }
}

test('startSession requires room id', async () => {
  await assert.rejects(() => voiceSessionsService.startSession(''), (error) => {
    assertAppError(error, 'VOICE_SESSION_ROOM_REQUIRED');
    return true;
  });
});

test('getSession returns session enriched with participants', async () => {
  await withPatchedRepo({
    async findById(id) {
      return { id, roomId: 'room-7', status: 'active' };
    },
    async participants(id) {
      return [{ sessionId: id, userId: 'user-1' }];
    }
  }, async () => {
    const result = await voiceSessionsService.getSession('session-1');
    assert.deepEqual(result, {
      id: 'session-1',
      roomId: 'room-7',
      status: 'active',
      participants: [{ sessionId: 'session-1', userId: 'user-1' }]
    });
  });
});

test('getSession throws when repository returns null', async () => {
  await withPatchedRepo({
    async findById() {
      return null;
    }
  }, async () => {
    await assert.rejects(() => voiceSessionsService.getSession('missing'), (error) => {
      assertAppError(error, 'VOICE_SESSION_NOT_FOUND');
      return true;
    });
  });
});

test('listByRoom requires room id', async () => {
  await assert.rejects(() => voiceSessionsService.listByRoom(null), (error) => {
    assertAppError(error, 'VOICE_SESSION_ROOM_REQUIRED');
    return true;
  });
});

test('endSession throws when active session does not exist', async () => {
  await withPatchedRepo({
    async endSession() {
      return null;
    }
  }, async () => {
    await assert.rejects(() => voiceSessionsService.endSession('missing'), (error) => {
      assertAppError(error, 'VOICE_SESSION_NOT_FOUND');
      return true;
    });
  });
});

test('saveTranscript defaults quality to draft and delegates to repository', async () => {
  await withPatchedRepo({
    async upsertTranscript(sessionId, quality, text, json, version) {
      return { sessionId, quality, contentText: text, contentJson: json, version };
    }
  }, async () => {
    const result = await voiceSessionsService.saveTranscript('session-2', '', 'текст', { ok: true }, 3);
    assert.deepEqual(result, {
      sessionId: 'session-2',
      quality: 'draft',
      contentText: 'текст',
      contentJson: { ok: true },
      version: 3
    });
  });
});
