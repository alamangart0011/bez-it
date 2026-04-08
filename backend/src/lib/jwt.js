import jwt from 'jsonwebtoken';
import { unauthorized } from './errors.js';

export const jwtUtil = {
  signAccess(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: Number(process.env.ACCESS_TOKEN_TTL_SEC || 900)
    });
  },
  signRefresh(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: Number(process.env.REFRESH_TOKEN_TTL_SEC || 2592000)
    });
  },
  verifyAccess(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw unauthorized('TOKEN_INVALID', 'Сессия недействительна', 'Токен доступа недействителен или истёк.');
    }
  },
  verifyRefresh(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw unauthorized('REFRESH_INVALID', 'Сессия истекла', 'Токен обновления недействителен или истёк.');
    }
  }
};
