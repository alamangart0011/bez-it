/*
 * Маршруты публичных приглашений.
 * Создание/листинг/отзыв — под authMiddleware, права проверяются в сервисе.
 * Превью и accept — токен в URL, preview публичный, accept требует вход.
 * QR-код рендерится через динамический import('qrcode'); если пакет
 * не установлен, отдаём 503 — клиент показывает ссылку без QR.
 */

import { Router } from 'express';
import { sendError } from '../lib/http-error.js';
import { badRequest } from '../lib/errors.js';
import { authMiddleware } from '../middleware/auth.js';

let qrcodeModule = null;
let qrcodeAttempted = false;
async function loadQrcode() {
  if (qrcodeModule || qrcodeAttempted) return qrcodeModule;
  qrcodeAttempted = true;
  try {
    const mod = await import('qrcode');
    qrcodeModule = mod.default || mod;
  } catch (error) {
    console.warn('[invites] qrcode package is not installed, QR render disabled:', error.message);
    qrcodeModule = null;
  }
  return qrcodeModule;
}

function buildInviteUrl(req, token) {
  const origin = req.headers.origin
    || (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host']
        ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
        : null)
    || `${req.protocol}://${req.get('host')}`;
  return `${origin}/invite/${token}`;
}

function fireWebhook(webhooksService, eventType, roomId, payload) {
  if (!webhooksService) return;
  try {
    webhooksService.emit({ eventType, roomId: roomId || null, payload }).catch((error) => {
      console.warn('[webhook] invite emit failed:', error?.message || error);
    });
  } catch (error) {
    console.warn('[webhook] invite emit sync threw:', error?.message || error);
  }
}

export function buildInvitesRouter({ roomInvitesService, webhooksService = null }) {
  const router = Router();

  // Создание приглашения для комнаты.
  router.post('/rooms/:roomId/invites', authMiddleware, async (req, res) => {
    try {
      const invite = await roomInvitesService.createForRoom({
        roomId:    req.params.roomId,
        actorUser: req.user,
        ttlSec:    req.body?.ttlSec ?? null,
        maxUses:   req.body?.maxUses ?? null,
        note:      req.body?.note ?? null
      });
      const url = buildInviteUrl(req, invite.token);
      res.status(201).json({ ...invite, url });
    } catch (error) {
      return sendError(res, error);
    }
  });

  // Активные приглашения комнаты (для UI модерации).
  router.get('/rooms/:roomId/invites', authMiddleware, async (req, res) => {
    try {
      const items = await roomInvitesService.listForRoom({
        roomId: req.params.roomId, actorUser: req.user
      });
      const withUrl = items.map((item) => ({ ...item, url: buildInviteUrl(req, item.token) }));
      res.json({ items: withUrl });
    } catch (error) {
      return sendError(res, error);
    }
  });

  // Отзыв приглашения по id.
  router.delete('/invites/:inviteId', authMiddleware, async (req, res) => {
    try {
      const result = await roomInvitesService.revoke({
        inviteId: req.params.inviteId, actorUser: req.user
      });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  // Публичный просмотр приглашения по токену — показываем минимум инфо.
  router.get('/invites/:token', async (req, res) => {
    try {
      const preview = await roomInvitesService.preview({ token: req.params.token });
      res.json(preview);
    } catch (error) {
      return sendError(res, error);
    }
  });

  // Принятие приглашения — нужен вход.
  router.post('/invites/:token/accept', authMiddleware, async (req, res) => {
    try {
      const result = await roomInvitesService.accept({ token: req.params.token, actorUser: req.user });
      if (result?.ok && !result.alreadyMember) {
        fireWebhook(webhooksService, 'user.joined_room', result.roomId, {
          roomId: result.roomId, userId: req.user.sub, via: 'invite'
        });
      }
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  // SVG QR-код для ссылки-приглашения.
  router.get('/invites/:token/qr.svg', async (req, res) => {
    try {
      await roomInvitesService.preview({ token: req.params.token });
    } catch (error) {
      return sendError(res, error);
    }
    const qrcode = await loadQrcode();
    if (!qrcode) {
      return sendError(res, badRequest('QR_UNAVAILABLE', 'QR-код недоступен', 'Установите пакет qrcode на сервере (npm ci).'));
    }
    try {
      const url = buildInviteUrl(req, req.params.token);
      const svg = await qrcode.toString(url, { type: 'svg', margin: 1, width: 320, errorCorrectionLevel: 'M' });
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.send(svg);
    } catch (error) {
      return sendError(res, error);
    }
  });

  return router;
}
