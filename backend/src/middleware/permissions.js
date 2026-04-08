import { forbidden } from '../lib/errors.js';
import { sendError } from '../lib/http-error.js';
import { hasPermission } from '../lib/permissions.js';

export function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role || 'blocked';
    if (!hasPermission(role, permission)) {
      return sendError(res, forbidden('FORBIDDEN', 'Недостаточно прав', 'У вас нет прав на это действие.'));
    }
    next();
  };
}

export const requireAdminAccess = requirePermission('admin.access');
export const requireVoiceAccess = requirePermission('voice.join');
