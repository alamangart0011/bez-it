import { Router } from 'express';
import { sendError } from '../lib/http-error.js';
import { badRequest } from '../lib/errors.js';
import { authMiddleware } from '../middleware/auth.js';

export function buildPushRouter({ pushService }) {
  const router = Router();

  router.get('/config', (req, res) => {
    res.json(pushService.getPublicConfig());
  });

  router.post('/subscribe', authMiddleware, async (req, res) => {
    try {
      const subscription = req.body?.subscription;
      if (!subscription?.endpoint) {
        throw badRequest('PUSH_SUBSCRIPTION_INVALID', 'Подписка не передана', 'Нужен объект subscription с endpoint и keys.');
      }
      const userAgent = req.headers['user-agent'] || null;
      const saved = await pushService.subscribe({ userId: req.user.sub, subscription, userAgent });
      res.json({ ok: true, id: saved.id, endpoint: saved.endpoint });
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/unsubscribe', authMiddleware, async (req, res) => {
    try {
      const endpoint = req.body?.endpoint;
      await pushService.unsubscribe({ userId: req.user.sub, endpoint });
      res.json({ ok: true });
    } catch (error) {
      return sendError(res, error);
    }
  });

  return router;
}
