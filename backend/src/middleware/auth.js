import { jwtUtil } from '../lib/jwt.js';
import { unauthorized } from '../lib/errors.js';
import { sendError } from '../lib/http-error.js';
import { authRepository } from '../repositories/auth.repository.js';

export async function authMiddleware(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';

  if (!token) return sendError(res, unauthorized('AUTH_REQUIRED', 'Требуется вход', 'Перед выполнением действия войдите в систему.'));

  try {
    const payload = jwtUtil.verifyAccess(token);
    if (!payload?.sid) {
      throw unauthorized('SESSION_INVALID', 'Сессия недействительна', 'Повторите вход в систему.');
    }
    const session = await authRepository.findActiveSessionById(payload.sid);
    if (!session || session.userId !== payload.sub) {
      throw unauthorized('SESSION_REVOKED', 'Сессия завершена', 'Текущая сессия уже завершена. Выполните вход повторно.');
    }
    req.user = payload;
    next();
  } catch (error) {
    return sendError(res, error);
  }
}
