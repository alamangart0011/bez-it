// pages/AuthPage.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function AuthPage({ onAuth }) {
  const [tab, setTab] = useState('qr');
  const [login, setLogin] = useState('admin@corpchat.local');
  const [pass, setPass] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrTimer, setQrTimer] = useState(120);
  const [qrStatus, setQrStatus] = useState('wait'); // wait | scanned | ok
  const timerRef = useRef(null);
  const otpRefs = useRef([]);

  // QR таймер
  useEffect(() => {
    if (tab !== 'qr') return;
    setQrTimer(120);
    setQrStatus('wait');
    timerRef.current = setInterval(() => {
      setQrTimer(v => {
        if (v <= 1) { clearInterval(timerRef.current); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [tab]);

  async function doPasswordLogin() {
    setError(''); setLoading(true);
    try {
      const d = await api.login(login, pass);
      if (d.accessToken) {
        localStorage.setItem('sg_token', d.accessToken);
        onAuth(d.accessToken, d.user);
      } else setError('Неверный логин или пароль');
    } catch (e) { setError('Ошибка входа: ' + e.message); }
    setLoading(false);
  }

  function formatPhone(v) {
    let n = v.replace(/\D/g, '');
    if (n.startsWith('8')) n = '7' + n.slice(1);
    if (!n.startsWith('7')) n = '7' + n;
    n = n.slice(0, 11);
    let f = '+7';
    if (n.length > 1) f += ' (' + n.slice(1, 4);
    if (n.length > 4) f += ') ' + n.slice(4, 7);
    if (n.length > 7) f += '-' + n.slice(7, 9);
    if (n.length > 9) f += '-' + n.slice(9, 11);
    return f;
  }

  async function sendSMS() {
    setError(''); setLoading(true);
    try {
      await fetch('/api/auth/phone/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' })
      });
      setOtpSent(true);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { setError('Ошибка отправки SMS'); }
    setLoading(false);
  }

  function handleOtp(i, val) {
    const next = [...otp]; next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.join('').length === 6) verifyOtp(next.join(''));
  }

  async function verifyOtp(code) {
    setLoading(true);
    try {
      const r = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const d = await r.json();
      if (d.accessToken) { localStorage.setItem('sg_token', d.accessToken); onAuth(d.accessToken, d.user); }
      else setError('Неверный код');
    } catch { setError('Ошибка проверки кода'); }
    setLoading(false);
  }

  const timerPct = qrTimer / 120;
  const r = 18;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ minHeight: '100vh', background: '#0e0f11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ background: '#161719', borderRadius: 20, padding: '36px 32px', width: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, border: '1px solid rgba(255,255,255,.07)' }}>
        
        {/* Logo */}
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>С</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f2f3f5' }}>Сигнум</div>
          <div style={{ fontSize: 13, color: '#80848e', marginTop: 4 }}>Корпоративный контур связи</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#1a1b1e', borderRadius: 10, padding: 3, width: '100%', gap: 2 }}>
          {[['qr', 'QR-код'], ['phone', 'Телефон'], ['pass', 'Пароль']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none',
              background: tab === k ? '#26272b' : 'transparent',
              color: tab === k ? '#f2f3f5' : '#80848e',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s'
            }}>{l}</button>
          ))}
        </div>

        {/* QR Tab */}
        {tab === 'qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
            <div style={{ fontSize: 12, color: '#80848e', textAlign: 'center', lineHeight: 1.6 }}>
              Откройте Сигнум на телефоне<br/>и отсканируйте код
            </div>
            <div onClick={() => { setQrStatus('scanned'); setTimeout(() => { setQrStatus('ok'); clearInterval(timerRef.current); setTimeout(() => setTab('pass'), 1500); }, 1500); }}
              style={{ width: 164, height: 164, background: '#fff', borderRadius: 12, padding: 10, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
              <svg width="144" height="144" viewBox="0 0 144 144">
                <rect x="8" y="8" width="42" height="42" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/><rect x="17" y="17" width="24" height="24" rx="2" fill="#111"/>
                <rect x="94" y="8" width="42" height="42" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/><rect x="103" y="17" width="24" height="24" rx="2" fill="#111"/>
                <rect x="8" y="94" width="42" height="42" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/><rect x="17" y="103" width="24" height="24" rx="2" fill="#111"/>
                {[[62,8],[72,8],[62,18],[72,18],[82,18],[62,62],[72,62],[82,62],[62,72],[82,72],[62,82],[72,82],[8,62],[18,62],[28,62],[8,72],[28,72],[8,82],[18,82],[94,62],[104,62],[114,72],[94,82],[104,82],[94,104],[104,114],[114,104],[124,94],[124,114]].map(([x,y],i) => (
                  <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill="#111"/>
                ))}
              </svg>
              {qrTimer > 0 && <div style={{ position: 'absolute', left: 10, right: 10, height: 2, background: 'rgba(88,101,242,.6)', animation: 'qrscan 3s ease-in-out infinite', top: 10 }}/>}
              {qrStatus === 'scanned' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(88,101,242,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12 }}><div style={{ fontSize: 28 }}>📲</div><div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Подтвердите на телефоне</div></div>}
              {qrStatus === 'ok' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(35,165,90,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12 }}><div style={{ fontSize: 28 }}>✅</div><div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Вход выполнен</div></div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 44, height: 44 }}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r={r} fill="none" stroke="#2a2b30" strokeWidth="3"/>
                  <circle cx="22" cy="22" r={r} fill="none"
                    stroke={qrTimer > 40 ? '#5865f2' : qrTimer > 15 ? '#f0a500' : '#ed4245'}
                    strokeWidth="3" strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - timerPct)}
                    transform="rotate(-90 22 22)" strokeLinecap="round"/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#f2f3f5' }}>{qrTimer}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: qrStatus === 'ok' ? '#23a55a' : qrStatus === 'scanned' ? '#f0a500' : '#4e5058', animation: qrStatus === 'scanned' ? 'blink .8s infinite' : 'none' }}/>
                  <div style={{ fontSize: 12, color: '#b5bac1' }}>
                    {qrStatus === 'ok' ? 'Вход выполнен' : qrStatus === 'scanned' ? 'Отсканировано...' : 'Ожидание сканирования'}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#4e5058', marginTop: 2 }}>Сессия защищена ЭЦП</div>
              </div>
            </div>
            {qrTimer === 0 && <button onClick={() => { setQrTimer(120); setQrStatus('wait'); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#80848e', fontSize: 12, cursor: 'pointer' }}>Обновить QR</button>}
          </div>
        )}

        {/* Phone Tab */}
        {tab === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="+7 (___) ___-__-__" maxLength={18}
              style={{ width: '100%', background: '#1a1b1e', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '11px 14px', color: '#f2f3f5', fontSize: 14, outline: 'none' }}/>
            {!otpSent
              ? <button onClick={sendSMS} disabled={loading || phone.replace(/\D/g, '').length < 11}
                  style={{ padding: 13, borderRadius: 10, border: 'none', background: '#5865f2', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? .6 : 1 }}>
                  {loading ? 'Отправка...' : 'Получить код'}
                </button>
              : <>
                  <div style={{ fontSize: 12, color: '#80848e', textAlign: 'center' }}>Введите 6-значный код из SMS:</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {otp.map((v, i) => (
                      <input key={i} ref={el => otpRefs.current[i] = el} value={v} maxLength={1}
                        onChange={e => handleOtp(i, e.target.value)}
                        style={{ width: 42, height: 48, background: '#1a1b1e', border: `1px solid ${v ? '#23a55a' : 'rgba(255,255,255,.1)'}`, borderRadius: 8, textAlign: 'center', color: '#f2f3f5', fontSize: 20, fontWeight: 700, outline: 'none' }}/>
                    ))}
                  </div>
                </>
            }
          </div>
        )}

        {/* Password Tab */}
        {tab === 'pass' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Email или логин"
              style={{ width: '100%', background: '#1a1b1e', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '11px 14px', color: '#f2f3f5', fontSize: 14, outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && doPasswordLogin()}/>
            <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Пароль"
              style={{ width: '100%', background: '#1a1b1e', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '11px 14px', color: '#f2f3f5', fontSize: 14, outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && doPasswordLogin()}/>
            <button onClick={doPasswordLogin} disabled={loading}
              style={{ padding: 13, borderRadius: 10, border: 'none', background: '#5865f2', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? .6 : 1 }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        )}

        {error && <div style={{ color: '#ed4245', fontSize: 12, textAlign: 'center' }}>{error}</div>}
      </div>

      <style>{`
        @keyframes qrscan { 0%{top:10px} 50%{top:152px} 100%{top:10px} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
