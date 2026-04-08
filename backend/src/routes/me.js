import { Router } from 'express';
import { meService } from '../services/me.service.js';
import { sendError } from '../lib/http-error.js';
import { validateProfileUpdatePayload, validateSettingsPayload } from '../validators/me.validators.js';

export const meRouter = Router();

meRouter.get('/', async (req, res) => {
  try {
    res.json(await meService.getMe(req.user));
  } catch (error) {
    return sendError(res, error);
  }
});

meRouter.patch('/', async (req, res) => {
  try {
    const payload = validateProfileUpdatePayload(req.body);
    res.json(await meService.updateProfile(req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});

meRouter.get('/settings', async (req, res) => {
  try {
    res.json(await meService.getSettings(req.user));
  } catch (error) {
    return sendError(res, error);
  }
});

meRouter.put('/settings', async (req, res) => {
  try {
    const payload = validateSettingsPayload(req.body);
    res.json(await meService.updateSettings(req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});
