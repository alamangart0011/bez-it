import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { validateEnv } from './config/env.js';
import { pool } from './db/pg.js';
import { authMiddleware } from './middleware/auth.js';
import { requestContext } from './middleware/request-context.js';
import { accessLog } from './middleware/access-log.js';
import { securityHeaders } from './middleware/security.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { buildRtcRouter } from './routes/rtc.js';
import { buildRoomsRouter } from './routes/rooms.js';
import { buildVoiceRouter } from './routes/voice.js';
import { buildVoiceSessionsRouter } from './routes/voice-sessions.js';
import { meetingsRouter } from './routes/meetings.js';
import { adminRouter } from './routes/admin.js';
import { aiJobsRouter } from './routes/ai-jobs.js';
import { registerSocketGateway } from './socket/gateway.js';
import { sendError } from './lib/http-error.js';

const config = validateEnv();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: config.socketPath,
  cors: { origin: config.corsOrigin, credentials: true }
});
app.set('io', io);

app.set('trust proxy', config.trustProxy);
app.use(requestContext);
app.use(securityHeaders);
if (config.requestLogEnabled) app.use(accessLog);
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(createRateLimiter({ windowMs: 60_000, max: config.generalRateLimit, prefix: 'api' }));
app.use('/uploads', express.static(path.resolve(config.uploadRoot), {
  index: false,
  maxAge: '7d'
}));

app.get('/api/live', (req, res) => {
  res.json({ ok: true, service: 'corpchat-api', ts: new Date().toISOString(), requestId: req.requestId || null });
});

app.get('/api/ready', async (req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true, service: 'corpchat-api', db: 'up', uploads: 'mounted', requestId: req.requestId || null });
  } catch {
    res.status(500).json({ ok: false, service: 'corpchat-api', db: 'down', requestId: req.requestId || null });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true, service: 'corpchat-api', ts: new Date().toISOString(), db: 'up', countryMode: config.appCountryMode, appName: config.appName, releaseVersion: config.releaseVersion, releaseChannel: config.releaseChannel, healthExternalUrl: config.healthExternalUrl || null, requestId: req.requestId || null });
  } catch {
    res.status(500).json({ ok: false, service: 'corpchat-api', db: 'down', requestId: req.requestId || null });
  }
});

app.get('/api/release', (req, res) => {
  res.json({ ok: true, appName: config.appName, releaseVersion: config.releaseVersion, releaseChannel: config.releaseChannel, socketPath: config.socketPath, countryMode: config.appCountryMode, healthExternalUrl: config.healthExternalUrl || null, requestLogEnabled: config.requestLogEnabled, requestId: req.requestId || null });
});

app.use('/api/auth', createRateLimiter({ windowMs: 60_000, max: config.authRateLimit, prefix: 'auth' }), authRouter);
app.use('/api/me', authMiddleware, meRouter);
app.use('/api/rtc', authMiddleware, buildRtcRouter(config));
app.use('/api/rooms', authMiddleware, buildRoomsRouter({ io, uploadRoot: config.uploadRoot, maxUploadBytes: config.maxUploadBytes }));
app.use('/api/voice', authMiddleware, buildVoiceRouter({ io }));
app.use('/api/voice-sessions', authMiddleware, buildVoiceSessionsRouter({ io }));
app.use('/api/meetings', authMiddleware, meetingsRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/ai-jobs', authMiddleware, aiJobsRouter);

const legacyDisabledMessage = {
  code: 'LEGACY_ENDPOINT_DISABLED',
  title: 'Легаси-маршрут отключён',
  message: 'Маршрут выведен из baseline V17. Используйте актуальные API комнаты/голоса/собраний.'
};

app.all(['/api/ai', '/api/ai/*'], (req, res) => {
  res.status(410).json(legacyDisabledMessage);
});

app.all(['/api/e2e', '/api/e2e/*'], (req, res) => {
  res.status(410).json(legacyDisabledMessage);
});

app.all(['/api/qr_phone_auth', '/api/qr_phone_auth/*'], (req, res) => {
  res.status(410).json(legacyDisabledMessage);
});

app.use((req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', title: 'Маршрут не найден', message: 'Проверьте адрес запроса.' });
});

app.use((error, req, res, next) => {
  if (error) return sendError(res, error);
  return next();
});

registerSocketGateway(io);

server.listen(config.apiPort, () => {
  console.log('CorpChat API started on port', config.apiPort);
});
