export function buildSmsSender() {
  const provider = String(process.env.OTP_PROVIDER || process.env.SMS_PROVIDER || 'dev').trim();

  return {
    provider,
    async sendOtp({ phone, code, purpose = 'login' }) {
      const message = purpose === 'bind_phone'
        ? `Сигнум: код подтверждения номера ${code}`
        : `Сигнум: код входа ${code}`;

      if (provider === 'dev' || provider === 'mock') {
        return {
          ok: true,
          provider,
          phone,
          message,
          debugCode: code
        };
      }

      return {
        ok: false,
        provider,
        phone,
        message,
        error: 'SMS provider is not wired in this branch yet'
      };
    }
  };
}
