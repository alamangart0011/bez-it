/**
 * qr_phone_auth.routes.js
 * QR-авторизация + вход по SMS + привязка телефона
 *
 * Добавить в server.js:
 *   app.use('/api/auth', require('./routes/qr_phone_auth.routes'));
 *
 * .env нужен:
 *   SMS_PROVIDER=smsru        # или smsc / mock
 *   SMS_API_KEY=ваш-ключ
 *   QR_SECRET=random-32-bytes
 */
'use strict';

const express    = require('express');
const router     = express.Router();
const crypto     = require('crypto');
const bcrypt     = require('bcryptjs');
const pool       = require('../db');
const { requireAuth } = require('../middleware/auth');
const { signJwt } = require('../services/jwt.service');

const QR_TTL_SEC  = 120;
const OTP_TTL_SEC = 300;
const OTP_LEN     = 6;

// ── УТИЛИТЫ ────────────────────────────────────────────────

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function randomOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashOTP(code) {
  return bcrypt.hash(code, 8);
}

async function verifyOTPHash(code, hash) {
  return bcrypt.compare(code, hash);
}

function deviceFingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  const ip = req.ip || '';
  return crypto.createHash('sha256').update(ua + ip).digest('hex');
}

// SMS провайдер — SMS.RU (бесплатные 5 смс в день на тесте)
async function sendSMS(phone, message) {
  const provider = process.env.SMS_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[SMS MOCK] → ${phone}: ${message}`);
    return { ok: true, mock: true };
  }

  if (provider === 'smsru') {
    const key = process.env.SMS_API_KEY;
    const url = `https://sms.ru/sms/send?api_id=${key}&to=${phone}&msg=${encodeURIComponent(message)}&json=1`;
    const r = await fetch(url);
    const d = await r.json();
    return { ok: d.status === 'OK', raw: d };
  }

  throw new Error(`Unknown SMS provider: ${provider}`);
}

// ── QR АВТОРИЗАЦИЯ ──────────────────────────────────────────

// POST /api/auth/qr/create
// Браузер создаёт QR-сессию → получает токен → рисует QR
router.post('/qr/create', async (req, res) => {
  try {
    const token      = randomToken();
    const deviceInfo = {
      ua:  req.headers['user-agent']?.substring(0, 200),
      ip:  req.ip,
      at:  new Date().toISOString(),
    };

    await pool.query(`
      INSERT INTO qr_sessions (token, device_info, expires_at)
      VALUES ($1, $2, now() + interval '${QR_TTL_SEC} seconds')
    `, [token, JSON.stringify(deviceInfo)]);

    // URL который кодируется в QR — телефон открывает его в приложении
    const qrUrl = `${process.env.APP_URL || 'https://ai.voice.oboron-it.ru'}/qr-confirm?t=${token}`;

    res.json({ token, qrUrl, ttl: QR_TTL_SEC });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/qr/status/:token
// Браузер поллит статус (long-poll или SSE)
router.get('/qr/status/:token', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT status, user_id, expires_at, confirmed_at
      FROM qr_sessions
      WHERE token = $1
    `, [req.params.token]);

    if (!rows[0]) return res.status(404).json({ error: 'QR not found' });

    const session = rows[0];
    if (new Date() > new Date(session.expires_at)) {
      return res.json({ status: 'expired' });
    }

    // Если подтверждено — возвращаем JWT
    if (session.status === 'confirmed' && session.user_id) {
      const userRes = await pool.query(
        'SELECT id, email, display_name, username, role, organization_id FROM users WHERE id = $1',
        [session.user_id]
      );
      const user = userRes.rows[0];
      if (user) {
        const accessToken  = signJwt({ sub: user.id, role: user.role, email: user.email, displayName: user.display_name });
        const refreshToken = signJwt({ sub: user.id, role: user.role }, 'refresh');

        // Помечаем как использованную
        await pool.query('UPDATE qr_sessions SET status=$1 WHERE token=$2', ['used', req.params.token]);

        return res.json({
          status: 'confirmed',
          accessToken,
          refreshToken,
          user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role }
        });
      }
    }

    res.json({ status: session.status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/qr/scan
// Телефон (авторизованный пользователь) сканирует QR
router.post('/qr/scan', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });

    const { rows } = await pool.query(`
      UPDATE qr_sessions
      SET status = 'scanned', scanned_at = now()
      WHERE token = $1 AND status = 'pending' AND expires_at > now()
      RETURNING id, device_info
    `, [token]);

    if (!rows[0]) return res.status(404).json({ error: 'QR не найден или истёк' });

    res.json({
      ok: true,
      deviceInfo: rows[0].device_info,
      message: 'QR отсканирован. Подтвердите вход на телефоне.',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/qr/confirm
// Телефон подтверждает вход — передаёт свой user_id в QR-сессию
router.post('/qr/confirm', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });

    const phoneDevice = {
      device: req.headers['user-agent']?.substring(0, 100),
      userId: req.user.id,
      at:     new Date().toISOString(),
    };

    const { rows } = await pool.query(`
      UPDATE qr_sessions
      SET status = 'confirmed',
          user_id = $2,
          phone_device = $3,
          confirmed_at = now()
      WHERE token = $1
        AND status IN ('pending','scanned')
        AND expires_at > now()
      RETURNING id
    `, [token, req.user.id, JSON.stringify(phoneDevice)]);

    if (!rows[0]) return res.status(404).json({ error: 'QR не найден или истёк' });

    res.json({ ok: true, message: 'Вход подтверждён' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/qr/confirm-page?t=TOKEN (для мобильного приложения)
router.get('/qr/confirm-page', (req, res) => {
  const token = req.query.t || '';
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Сигнум — Подтверждение входа</title>
<style>
body{font-family:-apple-system,sans-serif;background:#0f1012;color:#f2f3f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1a1b1e;border-radius:16px;padding:32px 24px;max-width:340px;width:100%;text-align:center}
.logo{width:56px;height:56px;border-radius:14px;background:#5865f2;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;margin:0 auto 16px}
h2{font-size:20px;font-weight:600;margin-bottom:8px}
p{font-size:14px;color:#80848e;line-height:1.6;margin-bottom:24px}
.btn{display:block;width:100%;padding:14px;border-radius:10px;border:none;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px}
.btn-confirm{background:#23a55a;color:#fff}
.btn-cancel{background:#2a2b30;color:#80848e}
.status{margin-top:16px;font-size:13px;color:#57c78a;display:none}
</style></head>
<body>
<div class="card">
  <div class="logo">С</div>
  <h2>Подтвердить вход?</h2>
  <p>Новый вход в систему Сигнум.<br>Если это не вы — отклоните.</p>
  <button class="btn btn-confirm" onclick="confirm_()">✓ Подтвердить</button>
  <button class="btn btn-cancel" onclick="cancel()">✕ Отклонить</button>
  <div class="status" id="st"></div>
</div>
<script>
const TOKEN='${token}';
async function confirm_(){
  const r=await fetch('/api/auth/qr/confirm',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem('accessToken')},body:JSON.stringify({token:TOKEN})});
  const d=await r.json();
  const st=document.getElementById('st');
  st.style.display='block';
  st.textContent=d.ok?'Вход подтверждён!':'Ошибка: '+(d.error||'');
}
function cancel(){document.body.innerHTML='<div style="color:#ed4245;text-align:center;margin-top:40vh;font-size:18px">Вход отклонён</div>';}
</script>
</body></html>`);
});

// ── SMS / OTP АВТОРИЗАЦИЯ ───────────────────────────────────

// POST /api/auth/phone/send-otp
router.post('/phone/send-otp', async (req, res) => {
  try {
    const { phone, purpose = 'login' } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) return res.status(400).json({ error: 'Некорректный номер' });

    // Rate limit — не чаще 1 раза в 60 сек
    const recent = await pool.query(`
      SELECT id FROM otp_codes
      WHERE phone = $1 AND created_at > now() - interval '60 seconds'
      LIMIT 1
    `, [clean]);
    if (recent.rows[0]) {
      return res.status(429).json({ error: 'Подождите 60 секунд между отправками' });
    }

    // Проверяем что номер привязан к какому-то пользователю
    const phoneRow = await pool.query(
      'SELECT user_id FROM user_phones WHERE phone=$1 AND verified=true LIMIT 1',
      [clean]
    );
    if (!phoneRow.rows[0] && purpose === 'login') {
      return res.status(404).json({ error: 'Номер не привязан к аккаунту' });
    }

    const code = randomOTP();
    const hash = await hashOTP(code);

    await pool.query(`
      INSERT INTO otp_codes (phone, code, purpose, expires_at)
      VALUES ($1, $2, $3, now() + interval '${OTP_TTL_SEC} seconds')
    `, [clean, hash, purpose]);

    const result = await sendSMS(clean, `Сигнум: ваш код ${code}. Действителен 5 минут.`);

    res.json({
      ok: true,
      mock: result.mock || false,
      debug: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/phone/verify-otp
router.post('/phone/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

    const clean = phone.replace(/\D/g, '');

    const otpRows = await pool.query(`
      SELECT id, code, attempts
      FROM otp_codes
      WHERE phone = $1 AND used = false AND expires_at > now()
        AND purpose = 'login'
      ORDER BY created_at DESC
      LIMIT 1
    `, [clean]);

    if (!otpRows.rows[0]) {
      return res.status(400).json({ error: 'Код истёк или не найден' });
    }

    const otp = otpRows.rows[0];

    if (otp.attempts >= 5) {
      await pool.query('UPDATE otp_codes SET used=true WHERE id=$1', [otp.id]);
      return res.status(400).json({ error: 'Слишком много попыток' });
    }

    const valid = await verifyOTPHash(code, otp.code);
    if (!valid) {
      await pool.query('UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1', [otp.id]);
      return res.status(400).json({ error: 'Неверный код', attemptsLeft: 5 - otp.attempts - 1 });
    }

    await pool.query('UPDATE otp_codes SET used=true WHERE id=$1', [otp.id]);

    // Находим пользователя
    const userRes = await pool.query(`
      SELECT u.id, u.email, u.display_name, u.username, u.role
      FROM users u
      JOIN user_phones up ON up.user_id = u.id
      WHERE up.phone = $1 AND up.verified = true
      LIMIT 1
    `, [clean]);

    if (!userRes.rows[0]) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userRes.rows[0];
    const accessToken  = signJwt({ sub: user.id, role: user.role, email: user.email, displayName: user.display_name });
    const refreshToken = signJwt({ sub: user.id, role: user.role }, 'refresh');

    // Запоминаем доверенное устройство
    const fp = deviceFingerprint(req);
    await pool.query(`
      INSERT INTO trusted_devices (user_id, device_hash, device_name, last_seen_at)
      VALUES ($1, $2, $3, now())
      ON CONFLICT (user_id, device_hash) DO UPDATE SET last_seen_at = now()
    `, [user.id, fp, req.headers['user-agent']?.substring(0, 100)]);

    res.json({
      ok: true,
      accessToken,
      refreshToken,
      user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ПРИВЯЗКА ТЕЛЕФОНА ───────────────────────────────────────

// POST /api/auth/phone/bind — отправить OTP для привязки
router.post('/phone/bind', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    const clean = phone?.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      return res.status(400).json({ error: 'Некорректный номер' });
    }

    // Проверяем не занят ли номер
    const existing = await pool.query(
      'SELECT user_id FROM user_phones WHERE phone=$1 AND verified=true LIMIT 1',
      [clean]
    );
    if (existing.rows[0] && existing.rows[0].user_id !== req.user.id) {
      return res.status(409).json({ error: 'Номер уже привязан к другому аккаунту' });
    }

    const code = randomOTP();
    const hash = await hashOTP(code);

    await pool.query(`
      INSERT INTO otp_codes (user_id, phone, code, purpose, expires_at)
      VALUES ($1, $2, $3, 'bind_phone', now() + interval '5 minutes')
    `, [req.user.id, clean, hash]);

    await sendSMS(clean, `Сигнум: код подтверждения номера: ${code}`);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/phone/bind/confirm — подтвердить привязку
router.post('/phone/bind/confirm', requireAuth, async (req, res) => {
  try {
    const { phone, code, deviceName = 'Мой телефон' } = req.body;
    const clean = phone?.replace(/\D/g, '');

    const otpRow = (await pool.query(`
      SELECT id, code FROM otp_codes
      WHERE phone=$1 AND user_id=$2 AND purpose='bind_phone'
        AND used=false AND expires_at > now()
      ORDER BY created_at DESC LIMIT 1
    `, [clean, req.user.id])).rows[0];

    if (!otpRow) return res.status(400).json({ error: 'Код истёк' });

    const valid = await verifyOTPHash(code, otpRow.code);
    if (!valid) return res.status(400).json({ error: 'Неверный код' });

    await pool.query('UPDATE otp_codes SET used=true WHERE id=$1', [otpRow.id]);

    // Привязываем телефон
    const isPrimary = (await pool.query(
      'SELECT COUNT(*) as c FROM user_phones WHERE user_id=$1 AND verified=true',
      [req.user.id]
    )).rows[0].c === '0';

    await pool.query(`
      INSERT INTO user_phones (user_id, phone, verified, is_primary, device_name, verified_at)
      VALUES ($1, $2, true, $3, $4, now())
      ON CONFLICT DO NOTHING
    `, [req.user.id, clean, isPrimary, deviceName]);

    res.json({ ok: true, isPrimary, message: 'Телефон привязан' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/phone/devices — список привязанных телефонов
router.get('/phone/devices', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, phone, is_primary, device_name, verified_at, created_at
      FROM user_phones
      WHERE user_id=$1 AND verified=true
      ORDER BY is_primary DESC, created_at ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/auth/phone/devices/:id
router.delete('/phone/devices/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_phones WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
