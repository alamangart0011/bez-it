import { tooManyRequests } from '../lib/errors.js';

function getClientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter({ windowMs, max, prefix = 'global' }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${prefix}:${getClientKey(req)}`;
    const current = buckets.get(key);

    if (!current || current.expiresAt <= now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return next(tooManyRequests('RATE_LIMITED', 'Слишком много запросов', 'Подождите немного и повторите попытку.'));
    }

    current.count += 1;
    return next();
  };
}
