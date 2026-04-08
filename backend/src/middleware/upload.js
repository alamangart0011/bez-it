import multer from 'multer';
import { badRequest } from '../lib/errors.js';

export function createUploadMiddleware(maxBytes) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes },
    fileFilter(req, file, callback) {
      if (!file.originalname) {
        callback(badRequest('FILE_INVALID', 'Некорректный файл', 'Не удалось определить имя файла.'));
        return;
      }
      callback(null, true);
    }
  });
}
