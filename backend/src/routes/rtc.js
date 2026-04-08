import { Router } from 'express';
import { requireVoiceAccess } from '../middleware/permissions.js';

export function buildRtcRouter(config) {
  const rtcRouter = Router();

  rtcRouter.get('/config', requireVoiceAccess, (req, res) => {
    res.json({
      iceServers: config.rtcIceServers,
      socketPath: config.socketPath,
      region: config.appCountryMode
    });
  });

  return rtcRouter;
}
