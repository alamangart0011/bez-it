import { aiJobsRepository } from '../repositories/ai-jobs.repository.js';
import { badRequest, notFound } from '../lib/errors.js';

export const aiJobsService = {
  async createJob(payload) {
    if (!payload?.type || !payload?.sourceType || !payload?.sourceId) {
      throw badRequest('AI_JOB_FIELDS_REQUIRED', 'Недостаточно данных', 'Нужны поля type, sourceType и sourceId.');
    }
    return aiJobsRepository.create(payload);
  },

  async getJob(id) {
    const job = await aiJobsRepository.findById(id);
    if (!job) throw notFound('AI_JOB_NOT_FOUND', 'Задача не найдена', 'AI-задача не найдена.');
    return job;
  },

  async listJobs(filters) {
    return aiJobsRepository.list(filters || {});
  },

  async cancelJob(id) {
    const cancelled = await aiJobsRepository.cancel(id);
    if (!cancelled) throw notFound('AI_JOB_NOT_CANCELLED', 'Задача не найдена', 'Задача уже завершена или не существует.');
    return cancelled;
  },

  async listOutputs(filters) {
    return aiJobsRepository.outputs(filters || {});
  },

  async getOutput(id) {
    const output = await aiJobsRepository.outputById(id);
    if (!output) throw notFound('AI_OUTPUT_NOT_FOUND', 'Результат не найден', 'AI-результат не найден.');
    return output;
  },

  async addFeedback(payload) {
    if (!payload?.outputId || !payload?.userId) {
      throw badRequest('AI_FEEDBACK_FIELDS_REQUIRED', 'Недостаточно данных', 'Нужны outputId и userId.');
    }
    return aiJobsRepository.addFeedback(payload);
  }
};
