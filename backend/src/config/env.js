import fs from 'fs';
import path from 'path';

const REQUIRED = [
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ACCESS_TOKEN_TTL_SEC',
  'REFRESH_TOKEN_TTL_SEC',
  'UPLOAD_ROOT',
  'MAX_UPLOAD_BYTES'
];

function parseOrigins(value) {
  if (!value) return true;
  const parts = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length <= 1 ? (parts[0] || true) : parts;
}

function buildIceServers(env) {
  if (env.RTC_ICE_SERVERS_JSON) {
    try {
      const parsed = JSON.parse(env.RTC_ICE_SERVERS_JSON);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new Error('ENV_INVALID:RTC_ICE_SERVERS_JSON');
    }
  }

  const servers = [];
  if (env.RTC_STUN_URLS) {
    servers.push({ urls: env.RTC_STUN_URLS.split(',').map((item) => item.trim()).filter(Boolean) });
  }
  if (env.RTC_TURN_URLS) {
    servers.push({
      urls: env.RTC_TURN_URLS.split(',').map((item) => item.trim()).filter(Boolean),
      username: env.RTC_TURN_USERNAME || undefined,
      credential: env.RTC_TURN_CREDENTIAL || undefined
    });
  }
  return servers;
}

export function validateEnv(env = process.env) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`ENV_MISSING:${missing.join(',')}`);
  }

  if (env.APP_COUNTRY_MODE && env.APP_COUNTRY_MODE !== 'RUSSIA_ONLY') {
    throw new Error('ENV_INVALID:APP_COUNTRY_MODE');
  }

  const uploadRoot = path.resolve(env.UPLOAD_ROOT);
  fs.mkdirSync(uploadRoot, { recursive: true });

  return {
    apiPort: Number(env.API_PORT || 3001),
    corsOrigin: parseOrigins(env.CORS_ORIGIN),
    uploadRoot,
    maxUploadBytes: Number(env.MAX_UPLOAD_BYTES || 26214400),
    socketPath: env.SOCKET_PATH || '/socket.io',
    appCountryMode: env.APP_COUNTRY_MODE || 'RUSSIA_ONLY',
    trustProxy: Number(env.TRUST_PROXY || 1),
    generalRateLimit: Number(env.RATE_LIMIT_PER_MINUTE || 180),
    authRateLimit: Number(env.AUTH_RATE_LIMIT_PER_MINUTE || 20),
    rtcIceServers: buildIceServers(env),
    appName: env.APP_NAME || 'Контур Связи',
    releaseVersion: env.RELEASE_VERSION || '17.17.0',
    releaseChannel: env.RELEASE_CHANNEL || 'operator-wallboard',
    healthExternalUrl: env.HEALTH_EXTERNAL_URL || '',
    requestLogEnabled: String(env.REQUEST_LOG_ENABLED || 'true') !== 'false',
    otpProvider: String(env.OTP_PROVIDER || env.SMS_PROVIDER || 'dev').trim().toLowerCase(),
    otpTtlSec: Number(env.OTP_TTL_SEC || 300),
    otpResendMinSec: Number(env.OTP_RESEND_MIN_SEC || 60),
    otpMaxAttempts: Number(env.OTP_MAX_ATTEMPTS || 5),
    otpExposeDevCode: String(env.OTP_EXPOSE_DEV_CODE || 'true') !== 'false'
  };
}
