import crypto from 'crypto';

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('8') && digits.length === 11) return `7${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 11) return digits;
  if (digits.length === 10) return `7${digits}`;
  return digits;
}

export function fingerprintDevice({ userAgent = '', ipAddress = '' } = {}) {
  return crypto.createHash('sha256').update(`${userAgent}|${ipAddress}`).digest('hex');
}

export function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}
