import { Router } from 'express';
import { meetingsService } from '../services/meetings.service.js';
import { sendError } from '../lib/http-error.js';
import { validateMeetingActionPayload, validateMeetingEventPayload, validateMeetingPatchPayload } from '../validators/meetings.validators.js';

export const meetingsRouter = Router();

meetingsRouter.get('/rooms/:roomId', async (req, res) => {
  try {
    res.json(await meetingsService.detail(req.params.roomId, req.user));
  } catch (error) {
    return sendError(res, error);
  }
});

meetingsRouter.patch('/rooms/:roomId', async (req, res) => {
  try {
    const payload = validateMeetingPatchPayload(req.body);
    res.json(await meetingsService.update(req.params.roomId, req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});


meetingsRouter.post('/rooms/:roomId/actions', async (req, res) => {
  try {
    const payload = validateMeetingActionPayload(req.body);
    res.json(await meetingsService.runAction(req.params.roomId, req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});

meetingsRouter.post('/rooms/:roomId/events', async (req, res) => {
  try {
    const payload = validateMeetingEventPayload(req.body);
    res.status(201).json(await meetingsService.createEvent(req.params.roomId, req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});
