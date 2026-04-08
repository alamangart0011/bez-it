export class AppError extends Error {
  constructor(status, code, title, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.title = title;
    this.details = details;
  }
}

export function badRequest(code, title, message, details = null) {
  return new AppError(400, code, title, message, details);
}

export function unauthorized(code = 'AUTH_REQUIRED', title = 'Требуется вход', message = 'Выполните вход повторно.') {
  return new AppError(401, code, title, message);
}

export function forbidden(code = 'FORBIDDEN', title = 'Недостаточно прав', message = 'У вас нет доступа к этому действию.') {
  return new AppError(403, code, title, message);
}

export function notFound(code, title, message) {
  return new AppError(404, code, title, message);
}

export function conflict(code, title, message) {
  return new AppError(409, code, title, message);
}

export function tooManyRequests(code = 'RATE_LIMITED', title = 'Слишком много запросов', message = 'Подождите немного и повторите попытку.') {
  return new AppError(429, code, title, message);
}
