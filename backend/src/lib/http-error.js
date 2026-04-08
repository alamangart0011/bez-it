import { AppError } from './errors.js';

export function sendError(res, error) {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      code: error.code,
      title: error.title,
      message: error.message,
      details: error.details || undefined
    });
  }

  console.error(error);
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    title: 'Внутренняя ошибка',
    message: 'Система не смогла завершить операцию. Повторите попытку позже.'
  });
}
