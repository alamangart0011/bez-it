import { Router } from 'express';
import { sendError } from '../lib/http-error.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  validatePhoneBindConfirmPayload,
  validatePhoneBindPayload,
  validatePhoneSendOtpPayload,
  validatePhoneVerifyOtpPayload
} from '../validators/auth.phone.validators.js';
import {
  presentPhoneDevicesList,
  presentPhoneOtpRequest,
  presentPhoneOtpVerify
} from './../services/auth.phone.presenters.js';

export function buildAuthPhoneRouter({ authPhoneService }) {
  const router = Router();

  function requestMeta(req) {
    return {
      userAgent: req.headers['user-agent'] || null,
      ipAddress: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || req.socket.remoteAddress || null
    };
  }

  router.post('/phone/send-otp', async (req, res) => {
    try {
      const payload = validatePhoneSendOtpPayload(req.body);
      const result = await authPhoneService.sendOtp({ ...payload, ...requestMeta(req) });
      res.json(presentPhoneOtpRequest(result));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/phone/verify-otp', async (req, res) => {
    try {
      const payload = validatePhoneVerifyOtpPayload(req.body);
      const result = await authPhoneService.verifyOtp({ ...payload, ...requestMeta(req) });
      res.json(presentPhoneOtpVerify(result));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/phone/bind', authMiddleware, async (req, res) => {
    try {
      validatePhoneBindPayload(req.body);
      await authPhoneService.bindPhone({ actorUserId: req.user.sub });
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.post('/phone/bind/confirm', authMiddleware, async (req, res) => {
    try {
      validatePhoneBindConfirmPayload(req.body);
      await authPhoneService.confirmPhoneBind({ actorUserId: req.user.sub });
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.get('/phone/devices', authMiddleware, async (req, res) => {
    try {
      const result = await authPhoneService.listPhoneDevices({ actorUserId: req.user.sub });
      res.json(presentPhoneDevicesList(result));
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.delete('/phone/devices/:deviceId', authMiddleware, async (req, res) => {
    try {
      const result = await authPhoneService.deletePhoneDevice({
        actorUserId: req.user.sub,
        deviceId: req.params.deviceId
      });
      res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  });

  return router;
}
