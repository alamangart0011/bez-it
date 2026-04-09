import { Router } from 'express';
import { aiJobsService } from '../services/ai-jobs.service.js';
import { sendError } from '../lib/http-error.js';

export const aiJobsRouter = Router();

aiJobsRouter.post('/jobs', async (req, res) => {
  try {
    const created = await aiJobsService.createJob({
      type: req.body?.type,
      sourceType: req.body?.source_type,
      sourceId: req.body?.source_id,
      templateId: req.body?.template_id,
      configJson: req.body?.config_json,
      createdBy: req.user?.sub || null,
      priority: req.body?.priority
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendError(res, error);
  }
});

aiJobsRouter.get('/jobs', async (req, res) => {
  try {
    const jobs = await aiJobsService.listJobs({
      sourceType: req.query.source_type,
      sourceId: req.query.source_id,
      status: req.query.status,
      limit: Number(req.query.limit) || 50
    });
    return res.json(jobs);
  } catch (error) {
    return sendError(res, error);
  }
});

aiJobsRouter.get('/jobs/:id', async (req, res) => {
  try {
    return res.json(await aiJobsService.getJob(req.params.id));
  } catch (error) {
    return sendError(res, error);
  }
});

aiJobsRouter.post('/jobs/:id/cancel', async (req, res) => {
  try {
    return res.json(await aiJobsService.cancelJob(req.params.id));
  } catch (error) {
    return sendError(res, error);
  }
});

aiJobsRouter.get('/outputs', async (req, res) => {
  try {
    return res.json(await aiJobsService.listOutputs({
      sourceType: req.query.source_type,
      sourceId: req.query.source_id,
      outputType: req.query.output_type
    }));
  } catch (error) {
    return sendError(res, error);
  }
});

aiJobsRouter.get('/outputs/:id', async (req, res) => {
  try {
    return res.json(await aiJobsService.getOutput(req.params.id));
  } catch (error) {
    return sendError(res, error);
  }
});

aiJobsRouter.post('/outputs/:id/feedback', async (req, res) => {
  try {
    const created = await aiJobsService.addFeedback({
      outputId: req.params.id,
      userId: req.user?.sub || null,
      rating: req.body?.rating,
      commentText: req.body?.comment_text
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendError(res, error);
  }
});
