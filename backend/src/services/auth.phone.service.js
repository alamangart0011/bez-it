import crypto from 'crypto';
import { badRequest, tooManyRequests, unauthorized, notFound } from '../lib/errors.js';
import { fingerprintDevice, hashOtp, normalizePhone, randomOtp } from './auth.device.js';

function buildUserView(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

export function buildAuthPhoneService({
  phoneAuthRepository,
  authRepository,
  auditRepository,
  jwtUtil,
  smsSender,
  config = {}
}) {
  const OTP_TTL_SEC    = Number(config.otpTtlSec    || 300);
  const RESEND_MIN_SEC = Number(config.otpResendMin || 60);
  const MAX_ATTEMPTS   = Number(config.otpMaxAttempts || 5);
  const REFRESH_TTL_SEC = Number(config.refreshTtlSec || process.env.REFRESH_TOKEN_TTL_SEC || 2592000);
  const EXPOSE_DEV_CODE = config.exposeDevCode !== false;

  function refreshExpiresAt() {
    return new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  }

  return {
    async sendOtp({ phone, purpose = 'login', userAgent = null, ipAddress = null }) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone || normalizedPhone.length < 11) {
        throw badRequest('PHONE_INVALID', 'Некорректный номер', 'Проверьте формат телефона.');
      }
      if (purpose !== 'login' && purpose !== 'bind_phone') {
        throw badRequest('PHONE_PURPOSE_INVALID', 'Неверная цель запроса', 'Допустимо только login или bind_phone.');
      }

      const recent = await phoneAuthRepository.findRecentOtp({
        phone: normalizedPhone, purpose, sinceSeconds: RESEND_MIN_SEC
      });
      if (recent) {
        throw tooManyRequests(
          'OTP_RESEND_TOO_SOON',
          'Код уже отправлен',
          `Следующий код можно запросить не раньше чем через ${RESEND_MIN_SEC} секунд.`
        );
      }

      const code = randomOtp();
      const codeHash = hashOtp(code);
      const expiresAt = new Date(Date.now() + OTP_TTL_SEC * 1000);

      await phoneAuthRepository.createOtpCode({
        phone: normalizedPhone,
        purpose,
        codeHash,
        expiresAt,
        maxAttempts: MAX_ATTEMPTS,
        meta: { userAgent, ipAddress }
      });

      const delivery = await smsSender.sendOtp({ phone: normalizedPhone, code, purpose });
      const isDev = delivery && (delivery.provider === 'dev' || delivery.provider === 'mock');

      await auditRepository.create({
        actorUserId: null,
        action: 'auth.phone.send_otp',
        target: normalizedPhone,
        result: delivery && delivery.ok ? 'success' : 'denied',
        meta: { userAgent, ipAddress, provider: delivery?.provider, purpose }
      });

      return {
        ok: Boolean(delivery?.ok),
        provider: delivery?.provider || 'dev',
        phone: normalizedPhone,
        purpose,
        ttlSeconds: OTP_TTL_SEC,
        resendAfterSeconds: RESEND_MIN_SEC,
        debugCode: isDev && EXPOSE_DEV_CODE ? code : null,
        message: delivery?.message || 'Код отправлен'
      };
    },

    async verifyOtp({ phone, code, purpose = 'login', userAgent = null, ipAddress = null }) {
      const normalizedPhone = normalizePhone(phone);
      const trimmedCode = String(code || '').trim();
      if (!normalizedPhone || normalizedPhone.length < 11) {
        throw badRequest('PHONE_INVALID', 'Некорректный номер', 'Проверьте формат телефона.');
      }
      if (!trimmedCode || trimmedCode.length < 4) {
        throw badRequest('OTP_REQUIRED', 'Нужен код подтверждения', 'Укажите код из SMS.');
      }

      const otp = await phoneAuthRepository.findLatestValidOtp({ phone: normalizedPhone, purpose });
      if (!otp) {
        await auditRepository.create({
          actorUserId: null, action: 'auth.phone.verify_otp', target: normalizedPhone,
          result: 'denied', meta: { userAgent, ipAddress, reason: 'no_active_otp' }
        });
        throw unauthorized('OTP_NOT_FOUND', 'Код не найден или истёк', 'Запросите новый код.');
      }

      if (otp.attempts >= otp.maxAttempts) {
        await auditRepository.create({
          actorUserId: null, action: 'auth.phone.verify_otp', target: normalizedPhone,
          result: 'denied', meta: { userAgent, ipAddress, reason: 'max_attempts', otpId: otp.id }
        });
        throw tooManyRequests('OTP_ATTEMPTS_EXCEEDED', 'Слишком много попыток', 'Запросите новый код.');
      }

      if (hashOtp(trimmedCode) !== otp.codeHash) {
        await phoneAuthRepository.incrementOtpAttempts(otp.id);
        await auditRepository.create({
          actorUserId: null, action: 'auth.phone.verify_otp', target: normalizedPhone,
          result: 'denied', meta: { userAgent, ipAddress, reason: 'code_mismatch', otpId: otp.id }
        });
        throw unauthorized('OTP_INVALID', 'Неверный код', 'Проверьте код из SMS.');
      }

      await phoneAuthRepository.markOtpUsed(otp.id);

      const user = await phoneAuthRepository.findUserByVerifiedPhone(normalizedPhone);
      if (!user) {
        await auditRepository.create({
          actorUserId: null, action: 'auth.phone.verify_otp', target: normalizedPhone,
          result: 'denied', meta: { userAgent, ipAddress, reason: 'no_user_for_phone', otpId: otp.id }
        });
        throw notFound(
          'PHONE_USER_NOT_LINKED',
          'Номер не привязан к сотруднику',
          'Попросите администратора привязать ваш номер к учётной записи.'
        );
      }

      const sessionId = crypto.randomUUID();
      const payload = {
        sub: user.id,
        sid: sessionId,
        role: user.role,
        email: user.email,
        displayName: user.displayName
      };
      const accessToken = jwtUtil.signAccess(payload);
      const refreshToken = jwtUtil.signRefresh(payload);

      await authRepository.createSession({
        id: sessionId,
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: refreshExpiresAt()
      });

      await auditRepository.create({
        actorUserId: user.id,
        action: 'auth.login',
        target: user.email,
        result: 'success',
        meta: { userAgent, ipAddress, sessionId, source: 'phone_otp', phone: normalizedPhone }
      });

      return {
        ok: true,
        accessToken,
        refreshToken,
        sessionId,
        user: buildUserView(user),
        phone: normalizedPhone,
        deviceFingerprint: fingerprintDevice({ userAgent, ipAddress })
      };
    },

    async bindPhone() {
      throw badRequest('PHONE_BIND_NOT_IMPLEMENTED', 'Операция пока не доступна', 'Привязка номера появится в следующем инкременте.');
    },

    async confirmPhoneBind() {
      throw badRequest('PHONE_BIND_NOT_IMPLEMENTED', 'Операция пока не доступна', 'Привязка номера появится в следующем инкременте.');
    },

    async listPhoneDevices({ actorUserId }) {
      return { actorUserId, devices: [] };
    },

    async deletePhoneDevice({ actorUserId, deviceId }) {
      return { ok: true, actorUserId, deviceId };
    }
  };
}
