import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { sendError } from '../lib/http-error.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  validateForgotPasswordPayload,
  validateInvitationAcceptPayload,
  validateInvitationPreview,
  validateLoginPayload,
  validatePasswordChangePayload,
  validateRefreshPayload,
  validateResetPasswordPayload,
  validateSessionRevokePayload
} from '../validators/auth.validators.js';

export const authRouter = Router();

function requestMeta(req) {
  return {
    userAgent: req.headers['user-agent'] || null,
    ipAddress: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || null
  };
}

authRouter.post('/login', async (req, res) => {
  try {
    const payload = validateLoginPayload(req.body);
    res.json(await authService.login({ ...payload, ...requestMeta(req) }));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post('/refresh', async (req, res) => {
  try {
    const payload = validateRefreshPayload(req.body);
    res.json(await authService.refresh({ ...payload, ...requestMeta(req) }));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post('/logout', authMiddleware, async (req, res) => {
  try {
    res.json(await authService.logout({ refreshToken: req.body?.refreshToken, actorUserId: req.user.sub, actorSessionId: req.user.sid }));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    res.json(await authService.logoutAll({ actorUserId: req.user.sub, actorSessionId: req.user.sid, excludeCurrent: Boolean(req.body?.excludeCurrent) }));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.get('/sessions', authMiddleware, async (req, res) => {
  try {
    res.json(await authService.listSessions({ actorUserId: req.user.sub, actorSessionId: req.user.sid }));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.delete('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = validateSessionRevokePayload(req.body, req.params);
    res.json(await authService.revokeSession({ actorUserId: req.user.sub, actorSessionId: req.user.sid, sessionId }));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const payload = validatePasswordChangePayload(req.body);
    res.json(await authService.changePassword({ actorUserId: req.user.sub, actorSessionId: req.user.sid, ...payload }));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post('/forgot-password', async (req, res) => {
  try {
    const payload = validateForgotPasswordPayload(req.body);
    res.json(await authService.forgotPassword(payload));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post('/reset-password', async (req, res) => {
  try {
    const payload = validateResetPasswordPayload(req.body);
    res.json(await authService.resetPassword(payload));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.get('/invite/:token', async (req, res) => {
  try {
    const payload = validateInvitationPreview(req.body, req.params);
    res.json(await authService.previewInvitation(payload));
  } catch (error) {
    return sendError(res, error);
  }
});

authRouter.post('/accept-invite', async (req, res) => {
  try {
    const payload = validateInvitationAcceptPayload(req.body);
    res.json(await authService.acceptInvitation({ ...payload, ...requestMeta(req) }));
  } catch (error) {
    return sendError(res, error);
  }
});
