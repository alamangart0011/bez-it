import https from 'https';
import { URL } from 'url';

const BRAND_PREFIX_LOGIN   = 'Контур: код входа';
const BRAND_PREFIX_BIND    = 'Контур: код подтверждения номера';

function buildMessage(code, purpose) {
  return purpose === 'bind_phone'
    ? `${BRAND_PREFIX_BIND} ${code}`
    : `${BRAND_PREFIX_LOGIN} ${code}`;
}

function postJsonHttps(url, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(payload);
    const req = https.request({
      method: 'POST',
      host: u.hostname,
      port: u.port || 443,
      path: u.pathname + (u.search || ''),
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('SMS_TIMEOUT')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildSmscProvider() {
  return {
    provider: 'smsc',
    async sendOtp({ phone, code, purpose }) {
      const login = process.env.SMSC_LOGIN;
      const psw   = process.env.SMSC_PASSWORD;
      const sender = process.env.SMSC_SENDER || undefined;
      if (!login || !psw) {
        return { ok: false, provider: 'smsc', phone, error: 'SMSC_CREDENTIALS_MISSING' };
      }
      const body = {
        login,
        psw,
        phones: phone,
        mes: buildMessage(code, purpose),
        fmt: 3,
        charset: 'utf-8',
        ...(sender ? { sender } : {})
      };
      try {
        const { status, body: json } = await postJsonHttps('https://smsc.ru/sys/send.php', body);
        const ok = status === 200 && json && !json.error;
        return {
          ok: Boolean(ok),
          provider: 'smsc',
          phone,
          message: buildMessage(code, purpose),
          providerResponse: json,
          error: ok ? null : (json?.error || `SMSC_HTTP_${status}`)
        };
      } catch (error) {
        return { ok: false, provider: 'smsc', phone, error: error.message || 'SMSC_REQUEST_FAILED' };
      }
    }
  };
}

function buildDevProvider() {
  return {
    provider: 'dev',
    async sendOtp({ phone, code, purpose }) {
      const message = buildMessage(code, purpose);
      console.log(`[sms:dev] → ${phone} "${message}"`);
      return { ok: true, provider: 'dev', phone, message, debugCode: code };
    }
  };
}

export function buildSmsSender() {
  const provider = String(process.env.OTP_PROVIDER || process.env.SMS_PROVIDER || 'dev').trim().toLowerCase();
  if (provider === 'smsc' || provider === 'smsc.ru') return buildSmscProvider();
  return buildDevProvider();
}
