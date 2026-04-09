import test from 'node:test';
import assert from 'node:assert/strict';

import { aiJobsService } from '../src/services/ai-jobs.service.js';
import { aiJobsRepository } from '../src/repositories/ai-jobs.repository.js';
import { AppError } from '../src/lib/errors.js';

function assertAppError(error, expectedCode) {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, expectedCode);
}

async function withPatchedRepo(methods, fn) {
  const original = {};
  for (const [key, value] of Object.entries(methods)) {
    original[key] = aiJobsRepository[key];
    aiJobsRepository[key] = value;
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      aiJobsRepository[key] = value;
    }
  }
}

test('createJob rejects incomplete payload', async () => {
  await assert.rejects(() => aiJobsService.createJob({ type: 'summary' }), (error) => {
    assertAppError(error, 'AI_JOB_FIELDS_REQUIRED');
    return true;
  });
});

test('createJob delegates to repository', async () => {
  await withPatchedRepo({
    async create(payload) {
      return { id: 10, ...payload };
    }
  }, async () => {
    const result = await aiJobsService.createJob({
      type: 'summary',
      sourceType: 'room',
      sourceId: '55',
      templateId: 'tpl-1',
      priority: 3
    });

    assert.deepEqual(result, {
      id: 10,
      type: 'summary',
      sourceType: 'room',
      sourceId: '55',
      templateId: 'tpl-1',
      priority: 3
    });
  });
});

test('getJob throws when repository returns null', async () => {
  await withPatchedRepo({
    async findById() {
      return null;
    }
  }, async () => {
    await assert.rejects(() => aiJobsService.getJob('404'), (error) => {
      assertAppError(error, 'AI_JOB_NOT_FOUND');
      return true;
    });
  });
});

test('cancelJob throws when nothing was cancelled', async () => {
  await withPatchedRepo({
    async cancel() {
      return null;
    }
  }, async () => {
    await assert.rejects(() => aiJobsService.cancelJob('77'), (error) => {
      assertAppError(error, 'AI_JOB_NOT_CANCELLED');
      return true;
    });
  });
});

test('addFeedback rejects anonymous payload without userId', async () => {
  await assert.rejects(() => aiJobsService.addFeedback({ outputId: '8', userId: null }), (error) => {
    assertAppError(error, 'AI_FEEDBACK_FIELDS_REQUIRED');
    return true;
  });
});

test('addFeedback delegates to repository', async () => {
  await withPatchedRepo({
    async addFeedback(payload) {
      return { id: 501, ...payload };
    }
  }, async () => {
    const result = await aiJobsService.addFeedback({
      outputId: '8',
      userId: 'user-1',
      rating: 5,
      commentText: 'ok'
    });

    assert.deepEqual(result, {
      id: 501,
      outputId: '8',
      userId: 'user-1',
      rating: 5,
      commentText: 'ok'
    });
  });
});
