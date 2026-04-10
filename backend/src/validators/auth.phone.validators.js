import { badRequest } from '../lib/errors.js';
import { normalizePhone } from '../services/auth.device.js';

function requirePhone(value, code = 'PHONE_REQUIRED', title = 'Нужен номер телефона', message = 'Укажите номер телефона.') {
  const phone = normalizePhone(value);
  if (!phone || phone.length < 11) {
    throw badRequest(code, title, message);
  }
  return phone;
}

export function validatePhoneSendOtpPayload(body) {
  return {
    phone: requirePhone(body?.phone),
    purpose: String(body?.purpose || 'login').trim() || 'login'
  };
}

export function validatePhoneVerifyOtpPayload(body) {
  const code = String(body?.code || '').trim();
  if (!code || code.length < 4) {
    throw badRequest('OTP_REQUIRED', 'Нужен код подтверждения', 'Укажите код из SMS.');
  }
  return {
    phone: requirePhone(body?.phone),
    code
  };
}

export function validatePhoneBindPayload(body) {
  return {
    phone: requirePhone(body?.phone),
    deviceName: String(body?.deviceName || '').trim() || null
  };
}

export function validatePhoneBindConfirmPayload(body) {
  const code = String(body?.code || '').trim();
  if (!code || code.length < 4) {
    throw badRequest('OTP_REQUIRED', 'Нужен код подтверждения', 'Укажите код подтверждения номера.');
  }
  return {
    phone: requirePhone(body?.phone),
    code,
    deviceName: String(body?.deviceName || '').trim() || null
  };
}
