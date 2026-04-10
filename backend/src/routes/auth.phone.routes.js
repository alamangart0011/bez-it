import { Router } from 'express';
import { sendError } from '../lib/http-error.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  validatePhoneBindConfirmPayload,
  validatePhoneBindPayload,
  validatePhoneSendOtpPayload,
  validatePhoneVerifyOtpPayload
} from '../validators/auth.phone.validators.js';

export const authPhoneRouter = Router();

function requestMeta(req) {
  return {
    userAgent: req.headers['user-agent'] || null,
    ipAddress: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || null
  };
}

function notReady(action) {
  return {
    ok: false,
    action,
    code: 'PHONE_AUTH_NOT_WIRED',
    message: 'Маршрут добавлен в кодовую базу и ожидает подключения service-layer.'
  };
}

authPhoneRouter.post('/phone/send-otp', async (req, res) => {
  try {
    validatePhoneSendOtpPayload(req.body);
    res.status(501).json(notReady('send-otp'));
  } catch (error) {
    return sendError(res, error);
  }
});

authPhoneRouter.post('/phone/verify-otp', async (req, res) => {
  try {
    validatePhoneVerifyOtpPayload(req.body);
    res.status(501).json(notReady('verify-otp'));
  } catch (error) {
    return sendError(res, error);
  }
});

authPhoneRouter.post('/phone/bind', authMiddleware, async (req, res) => {
  try {
    validatePhoneBindPayload(req.body);
    res.status(501).json({ ...notReady('bind'), ...requestMeta(req) });
  } catch (error) {
    return sendError(res, error);
  }
});

authPhoneRouter.post('/phone/bind/confirm', authMiddleware, async (req, res) => {
  try {
    validatePhoneBindConfirmPayload(req.body);
    res.status(501).json({ ...notReady('bind-confirm'), ...requestMeta(req) });
  } catch (error) {
    return sendError(res, error);
  }
});

authPhoneRouter.get('/phone/devices', authMiddleware, async (req, res) => {
  try {
    res.status(501).json({ ...notReady('devices'), actorUserId: req.user.sub });
  } catch (error) {
    return sendError(res, error);
  }
});

authPhoneRouter.delete('/phone/devices/:deviceId', authMiddleware, async (req, res) => {
  try {
    res.status(501).json({ ...notReady('device-delete'), actorUserId: req.user.sub, deviceId: req.params.deviceId });
  } catch (error) {
    return sendError(res, error);
  }
});
