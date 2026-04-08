import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { badRequest } from './errors.js';

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const BLOCKED_EXTENSIONS = new Set(['.exe', '.msi', '.bat', '.cmd', '.ps1', '.sh', '.jar', '.com', '.scr']);

export function sanitizeFileName(fileName) {
  return String(fileName || 'file')
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

export function buildStoredFileName(originalName) {
  const ext = path.extname(originalName || '').slice(0, 12);
  return `${crypto.randomUUID()}${ext}`;
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function resolveUploadTarget(rootDir, roomId) {
  return ensureDir(path.join(rootDir, roomId));
}

export function getAttachmentKind(contentType) {
  if (!contentType) return 'file';
  if (IMAGE_TYPES.has(contentType)) return 'image';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('video/')) return 'video';
  return 'file';
}

export function validateUpload(file, maxBytes) {
  if (!file) throw badRequest('FILE_REQUIRED', 'Файл не передан', 'Загрузите файл и повторите попытку.');
  if (Number(file.size || 0) <= 0) throw badRequest('FILE_EMPTY', 'Пустой файл', 'Нельзя загрузить пустой файл.');
  if (Number(file.size || 0) > maxBytes) {
    throw badRequest('FILE_TOO_LARGE', 'Файл слишком большой', 'Размер файла превышает допустимый лимит.');
  }
  const extension = path.extname(String(file.originalname || '')).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    throw badRequest('FILE_BLOCKED', 'Файл запрещён', 'Исполняемые и скриптовые файлы запрещены в production-контуре.');
  }
}
