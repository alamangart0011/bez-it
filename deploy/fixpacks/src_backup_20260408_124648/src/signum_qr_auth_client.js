/**
 * signum_qr_auth_client.js
 * Клиент QR-авторизации + SMS-входа для браузера
 *
 * Зависимость: qrcode.js (CDN)
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
 *
 * Использование:
 *   import { QRAuth } from './signum_qr_auth_client.js';
 *   QRAuth.renderLoginPage(document.getElementById('login-root'));
 */
'use strict';

const POLL_INTERVAL = 2000; // мс между проверками статуса

// ── CORE QR AUTH ─────────────────────────────────────────────

async function createQRSession() {
  const r = await fetch('/api/auth/qr/create', { method: 'POST' });
  if (!r.ok) throw new Error('Не удалось создать QR-сессию');
  return r.json(); // { token, qrUrl, ttl }
}

async function pollQRStatus(token, onStatus) {
  let polling = true;

  const interval = setInterval(async () => {
    if (!polling) return;
    try {
      const r = await fetch(`/api/auth/qr/status/${token}`);
      const d = await r.json();
      onStatus(d);

      if (['confirmed', 'expired', 'error'].includes(d.status)) {
        polling = false;
        clearInterval(interval);
      }
    } catch (e) {
      console.error('[QR poll error]', e.message);
    }
  }, POLL_INTERVAL);

  return () => { polling = false; clearInterval(interval); };
}

// ── QR UI ─────────────────────────────────────────────────────

function renderQRBox(container, qrUrl, ttl) {
  container.innerHTML = '';

  const box = document.createElement('div');
  box.style.cssText = `
    width:160px;height:160px;background:#fff;border-radius:12px;
    padding:8px;display:flex;align-items:center;justify-content:center;
    position:relative;overflow:hidden;
  `;
  container.appendChild(box);

  if (window.QRCode) {
    new window.QRCode(box, {
      text:   qrUrl,
      width:  144,
      height: 144,
      colorDark:  '#111214',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  } else {
    box.textContent = 'QR';
    box.style.fontSize = '48px';
    box.style.color = '#111';
    box.style.fontWeight = '700';
  }

  // Таймер
  const scanLine = document.createElement('div');
  scanLine.style.cssText = `
    position:absolute;left:8px;right:8px;height:2px;
    background:rgba(88,101,242,.5);
    animation:qr-scan ${ttl}s linear forwards;
    top:8px;
  `;
  box.appendChild(scanLine);

  if (!document.getElementById('qr-scan-keyframes')) {
    const s = document.createElement('style');
    s.id = 'qr-scan-keyframes';
    s.textContent = '@keyframes qr-scan{0%{top:8px}100%{top:152px}}';
    document.head.appendChild(s);
  }

  return box;
}

// ── SMS AUTH ──────────────────────────────────────────────────

async function sendOTP(phone) {
  const r = await fetch('/api/auth/phone/send-otp', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ phone, purpose: 'login' }),
  });
  return r.json();
}

async function verifyOTP(phone, code) {
  const r = await fetch('/api/auth/phone/verify-otp', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ phone, code }),
  });
  return r.json();
}

// ── BIND PHONE ────────────────────────────────────────────────

async function bindPhone(phone, token) {
  const r = await fetch('/api/auth/phone/bind', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ phone }),
  });
  return r.json();
}

async function confirmBindPhone(phone, code, deviceName, token) {
  const r = await fetch('/api/auth/phone/bind/confirm', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ phone, code, deviceName }),
  });
  return r.json();
}

async function getPhoneDevices(token) {
  const r = await fetch('/api/auth/phone/devices', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

// ── AUTH STATE ────────────────────────────────────────────────

function saveTokens({ accessToken, refreshToken, user }) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  window._v17token = accessToken;
  window.dispatchEvent(new CustomEvent('signum:auth', { detail: { user, accessToken } }));
}

// ── FULL LOGIN PAGE ───────────────────────────────────────────

function renderLoginPage(root) {
  if (!root) return;
  root.style.cssText = `
    min-height:100vh;background:#0f1012;display:flex;
    align-items:center;justify-content:center;
  `;

  root.innerHTML = `
    <div style="background:#111214;border-radius:20px;padding:32px 28px;width:340px;display:flex;flex-direction:column;align-items:center;gap:20px;border:1px solid #1a1b1e">
      <div style="width:48px;height:48px;border-radius:14px;background:#5865f2;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">С</div>
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:600;color:#f2f3f5">Вход в Сигнум</div>
        <div style="font-size:13px;color:#80848e;margin-top:4px">Корпоративный контур</div>
      </div>

      <div style="display:flex;background:#1a1b1e;border-radius:10px;padding:3px;width:100%">
        <button id="tab-qr-btn"    style="${tabStyle(true)}"  onclick="switchLoginTab('qr')">QR-код</button>
        <button id="tab-phone-btn" style="${tabStyle(false)}" onclick="switchLoginTab('phone')">Телефон</button>
      </div>

      <div id="login-qr-section" style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%">
        <div style="font-size:13px;color:#80848e;text-align:center">Откройте Сигнум на телефоне<br>и отсканируйте код</div>
        <div id="qr-render-box"></div>
        <div id="qr-status-text" style="font-size:12px;color:#80848e">Ожидание сканирования...</div>
        <button onclick="window._qrRefresh&&window._qrRefresh()" style="${secBtnStyle()}">Обновить QR</button>
      </div>

      <div id="login-phone-section" style="display:none;flex-direction:column;gap:12px;width:100%">
        <input id="phone-login-inp" placeholder="+7 (___) ___-__-__" maxlength="18"
          style="width:100%;background:#1a1b1e;border:1px solid #2a2b30;border-radius:10px;padding:11px 14px;color:#f2f3f5;font-size:14px;outline:none"
          oninput="formatPhoneInp(this)"/>
        <button onclick="doSendOTP()" id="send-otp-btn" style="${primBtnStyle()}">Получить код</button>
        <div id="otp-verify-section" style="display:none;flex-direction:column;gap:10px;width:100%">
          <div style="font-size:12px;color:#80848e;text-align:center">Введите 6-значный код из SMS</div>
          <div style="display:flex;gap:8px;justify-content:center">
            ${[0,1,2,3,4,5].map(i=>`<input id="ol${i}" maxlength="1" style="width:40px;height:46px;background:#1a1b1e;border:1px solid #2a2b30;border-radius:8px;text-align:center;color:#f2f3f5;font-size:20px;font-weight:600;outline:none" oninput="otp2Next(this,${i})">`).join('')}
          </div>
          <button onclick="doVerifyOTP()" id="do-verify-btn" style="${primBtnStyle()}">Войти</button>
        </div>
      </div>

    </div>
  `;

  window.switchLoginTab = (tab) => {
    const qrS = document.getElementById('login-qr-section');
    const phS = document.getElementById('login-phone-section');
    const qrB = document.getElementById('tab-qr-btn');
    const phB = document.getElementById('tab-phone-btn');
    qrS.style.display = tab === 'qr' ? 'flex' : 'none';
    phS.style.display = tab === 'phone' ? 'flex' : 'none';
    qrB.style.cssText = tabStyle(tab === 'qr');
    phB.style.cssText = tabStyle(tab === 'phone');
  };

  window.formatPhoneInp = (inp) => {
    let v = inp.value.replace(/\D/g, '');
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let fmt = '+7';
    if (v.length > 1) fmt += ' (' + v.slice(1, 4);
    if (v.length > 4) fmt += ') ' + v.slice(4, 7);
    if (v.length > 7) fmt += '-' + v.slice(7, 9);
    if (v.length > 9) fmt += '-' + v.slice(9, 11);
    inp.value = fmt;
  };

  window.doSendOTP = async () => {
    const phone = document.getElementById('phone-login-inp').value;
    const btn = document.getElementById('send-otp-btn');
    btn.disabled = true; btn.textContent = 'Отправка...';
    const r = await sendOTP(phone);
    if (r.ok) {
      document.getElementById('otp-verify-section').style.display = 'flex';
      btn.textContent = 'Отправлено';
    } else {
      btn.disabled = false; btn.textContent = 'Получить код';
      document.getElementById('qr-status-text').textContent = r.error || 'Ошибка';
    }
  };

  window.otp2Next = (inp, idx) => {
    if (inp.value.length === 1 && idx < 5) {
      document.getElementById(`ol${idx + 1}`)?.focus();
    }
  };

  window.doVerifyOTP = async () => {
    const phone = document.getElementById('phone-login-inp').value;
    const code  = [0,1,2,3,4,5].map(i => document.getElementById(`ol${i}`)?.value || '').join('');
    if (code.length < 6) return;
    const r = await verifyOTP(phone, code);
    if (r.ok) { saveTokens(r); root.innerHTML = '<div style="color:#23a55a;text-align:center;padding:40px;font-size:16px">✓ Вход выполнен</div>'; }
    else { alert(r.error || 'Неверный код'); }
  };

  initQR(root);
}

async function initQR(root) {
  let stopPoll = null;

  async function start() {
    try {
      const { token, qrUrl, ttl } = await createQRSession();
      const box = document.getElementById('qr-render-box');
      if (!box) return;
      renderQRBox(box, qrUrl, ttl);

      if (stopPoll) stopPoll();
      stopPoll = await pollQRStatus(token, (d) => {
        const st = document.getElementById('qr-status-text');
        if (!st) return;
        if (d.status === 'pending')   st.textContent = 'Ожидание сканирования...';
        if (d.status === 'scanned')   { st.textContent = 'Отсканировано! Подтвердите на телефоне.'; st.style.color = '#f0a500'; }
        if (d.status === 'confirmed') { st.textContent = 'Вход подтверждён!'; st.style.color = '#23a55a'; saveTokens(d); }
        if (d.status === 'expired')   { st.textContent = 'QR истёк — нажмите Обновить.'; st.style.color = '#ed4245'; }
      });

      setTimeout(() => { if (stopPoll) { stopPoll(); stopPoll = null; } }, ttl * 1000 + 1000);
    } catch (e) {
      console.error('[QR init]', e.message);
    }
  }

  window._qrRefresh = start;
  start();
}

function tabStyle(active) {
  return `flex:1;padding:7px 4px;border-radius:7px;border:none;font-size:13px;font-weight:500;cursor:pointer;background:${active?'#2a2b30':'transparent'};color:${active?'#f2f3f5':'#80848e'};transition:all .15s`;
}
function primBtnStyle() {
  return 'width:100%;padding:12px;border-radius:10px;border:none;background:#5865f2;color:#fff;font-size:14px;font-weight:600;cursor:pointer';
}
function secBtnStyle() {
  return 'padding:8px 16px;border-radius:8px;border:1px solid #2a2b30;background:transparent;color:#80848e;font-size:12px;cursor:pointer';
}

export const QRAuth = {
  renderLoginPage,
  createQRSession,
  pollQRStatus,
  sendOTP,
  verifyOTP,
  bindPhone,
  confirmBindPhone,
  getPhoneDevices,
  saveTokens,
};

if (typeof window !== 'undefined') window.QRAuth = QRAuth;
