import crypto from 'crypto';
import { bezItLeadsRepository } from '../repositories/bez-it-leads.repository.js';
import { unauthorized } from '../lib/errors.js';
import { sendError } from '../lib/http-error.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  if (req.headers['x-cabinet-token']) return String(req.headers['x-cabinet-token']).trim();
  if (req.query && req.query.token) return String(req.query.token).trim();
  return null;
}

let seedChecked = false;
async function ensureEnvToken() {
  if (seedChecked) return;
  seedChecked = true;
  const envToken = process.env.BEZIT_CABINET_TOKEN;
  if (!envToken) return;
  try {
    await bezItLeadsRepository.ensureSeedToken(hashToken(envToken), 'env-seed');
  } catch (err) {
    console.warn('bez-it cabinet token seed failed:', err && err.message);
  }
}

export async function bezItCabinetAuth(req, res, next) {
  try {
    await ensureEnvToken();
    const token = extractToken(req);
    if (!token || token.length < 16) {
      throw unauthorized('CABINET_TOKEN_REQUIRED', 'Нужен токен кабинета', 'Укажите токен доступа к кабинету ИП.');
    }
    const record = await bezItLeadsRepository.findTokenByHash(hashToken(token));
    if (!record) {
      throw unauthorized('CABINET_TOKEN_INVALID', 'Токен не принят', 'Обратитесь к администратору за новым токеном.');
    }
    await bezItLeadsRepository.touchToken(record.id);
    req.cabinet = { tokenId: record.id, label: record.label };
    return next();
  } catch (error) {
    return sendError(res, error);
  }
}
