/*
 * Админ-маршруты управления исходящими вебхуками.
 * Требуется право webhooks.manage.
 */

import { Router } from 'express';
import { sendError } from '../lib/http-error.js';
import { requirePermission } from '../middleware/permissions.js';

export function buildWebhooksRouter({ webhooksService }) {
  const router = Router();

  router.use(requirePermission('webhooks.manage'));

  router.get('/events', (req, res) => {
    res.json({ events: webhooksService.allowedEvents });
  });

  router.get('/', async (req, res) => {
    try {
      const items = await webhooksService.list();
      res.json({ items });
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/', async (req, res) => {
    try {
      const created = await webhooksService.create({ actorUser: req.user, payload: req.body });
      res.status(201).json(created);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      const updated = await webhooksService.update({ id: req.params.id, actorUser: req.user, payload: req.body });
      res.json(updated);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const result = await webhooksService.remove({ id: req.params.id, actorUser: req.user });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/:id/test', async (req, res) => {
    try {
      const result = await webhooksService.sendTest({ id: req.params.id, actorUser: req.user });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.get('/:id/deliveries', async (req, res) => {
    try {
      const items = await webhooksService.recentDeliveries({ webhookId: req.params.id, limit: req.query.limit });
      res.json({ items });
    } catch (error) {
      return sendError(res, error);
    }
  });

  return router;
}
