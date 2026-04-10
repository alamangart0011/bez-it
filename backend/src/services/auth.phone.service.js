import { badRequest } from '../lib/errors.js';
import { fingerprintDevice, hashOtp, normalizePhone, randomOtp } from './auth.device.js';

export function buildAuthPhoneService({ phoneAuthRepository, authService = null, usersRepository = null, auditRepository = null }) {
  return {
    async sendOtp({ phone, purpose = 'login' }) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone || normalizedPhone.length < 11) {
        throw badRequest('PHONE_INVALID', 'Некорректный номер', 'Проверьте формат телефона.');
      }
      return {
        ok: true,
        purpose,
        phone: normalizedPhone,
        codePreview: randomOtp(),
        codeHashPreview: hashOtp('000000')
      };
    },

    async verifyOtp({ phone, code, userAgent = null, ipAddress = null }) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone || !code) {
        throw badRequest('OTP_REQUIRED', 'Нужен код подтверждения', 'Укажите телефон и код из SMS.');
      }
      return {
        ok: true,
        phone: normalizedPhone,
        deviceFingerprint: fingerprintDevice({ userAgent, ipAddress }),
        authServiceReady: Boolean(authService),
        usersRepositoryReady: Boolean(usersRepository),
        auditRepositoryReady: Boolean(auditRepository),
        repositoryReady: Boolean(phoneAuthRepository)
      };
    },

    async bindPhone({ actorUserId, phone, deviceName = null }) {
      const normalizedPhone = normalizePhone(phone);
      if (!actorUserId || !normalizedPhone) {
        throw badRequest('PHONE_BIND_INVALID', 'Некорректные данные', 'Нужен пользователь и номер телефона.');
      }
      return {
        ok: true,
        actorUserId,
        phone: normalizedPhone,
        deviceName,
        stage: 'otp_requested'
      };
    },

    async confirmPhoneBind({ actorUserId, phone, code, deviceName = null }) {
      const normalizedPhone = normalizePhone(phone);
      if (!actorUserId || !normalizedPhone || !code) {
        throw badRequest('PHONE_BIND_CONFIRM_INVALID', 'Нужны данные подтверждения', 'Укажите код и номер телефона.');
      }
      return {
        ok: true,
        actorUserId,
        phone: normalizedPhone,
        deviceName,
        stage: 'verified'
      };
    },

    async listPhoneDevices({ actorUserId }) {
      return {
        actorUserId,
        devices: []
      };
    },

    async deletePhoneDevice({ actorUserId, deviceId }) {
      return {
        ok: true,
        actorUserId,
        deviceId
      };
    }
  };
}
