// src/pages/AuthPage.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

const S = {
  wrap: { minHeight:'100vh', background:'#0e0f11', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,-apple-system,sans-serif' },
  card: { background:'#161719', borderRadius:20, padding:'36px 32px', width:380, display:'flex', flexDirection:'column', alignItems:'center', gap:20, border:'1px solid rgba(255,255,255,.07)' },
  logo: { width:52, height:52, borderRadius:14, background:'#5865f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff' },
  tabs: { display:'flex', background:'#1a1b1e', borderRadius:10, padding:3, width:'100%', gap:2 },
  inp:  { width:'100%', background:'#1a1b1e', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'11px 14px', color:'#f2f3f5', fontSize:14, outline:'none', fontFamily:'inherit' },
  btn:  { width:'100%', padding:13, borderRadius:10, border:'none', background:'#5865f2', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' },
  err:  { color:'#ed4245', fontSize:12, textAlign:'center' },
};

export default function AuthPage({ onAuth }) {
  const [tab, setTab]         = useState('qr');
  const [login, setLogin]     = useState('admin@corpchat.local');
  const [pass, setPass]       = useState('');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['','','','','','']);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(120);
  const [qrState, setQrState] = useState('wait');
  const timerRef  = useRef(null);
  const otpRefs   = useRef([]);

  useEffect(() => {
    if (tab !== 'qr') return;
    setTimer(120); setQrState('wait');
    timerRef.current = setInterval(() => setTimer(v => { if (v <= 1) { clearInterval(timerRef.current); return 0; } return v - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [tab]);

  async function doLogin() {
    setError(''); setLoading(true);
    try {
      const d = await api.login(login, pass);
      if (d.accessToken) {
        localStorage.setItem('sg_token', d.accessToken);
        onAuth(d.accessToken, d.user || null);
      } else setError('Неверный логин или пароль');
    } catch (e) { setError(e.status === 401 ? 'Неверный логин или пароль' : 'Ошибка: ' + e.message); }
    setLoading(false);
  }

  function fmtPhone(v) {
    let n = v.replace(/\D/g,''); if (n.startsWith('8')) n = '7'+n.slice(1); if (!n.startsWith('7')) n = '7'+n; n = n.slice(0,11);
    let f = '+7'; if (n.length>1) f+=' ('+n.slice(1,4); if (n.length>4) f+=') '+n.slice(4,7); if (n.length>7) f+='-'+n.slice(7,9); if (n.length>9) f+='-'+n.slice(9,11); return f;
  }

  async function sendSMS() {
    setError(''); setLoading(true);
    try {
      await fetch('/api/auth/phone/send-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, purpose:'login' }) });
      setOtpSent(true); setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { setError('Ошибка отправки'); }
    setLoading(false);
  }

  function handleOtp(i, val) {
    const n=[...otp]; n[i]=val.slice(-1); setOtp(n);
    if (val && i<5) otpRefs.current[i+1]?.focus();
    const code = n.join(''); if (code.length===6) verifyOtp(code);
  }

  async function verifyOtp(code) {
    setLoading(true);
    try {
      const d = await (await fetch('/api/auth/phone/verify-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, code }) })).json();
      if (d.accessToken) { localStorage.setItem('sg_token', d.accessToken); onAuth(d.accessToken, d.user); }
      else setError('Неверный код');
    } catch { setError('Ошибка'); }
    setLoading(false);
  }

  function simulateQR() {
    if (qrState !== 'wait') return;
    setQrState('scan');
    setTimeout(() => { setQrState('ok'); clearInterval(timerRef.current); setTimeout(() => setTab('pass'), 1000); }, 1800);
  }

  const pct = timer / 120; const circ = 2 * Math.PI * 18;

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.logo}>С</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#f2f3f5' }}>Сигнум</div>
          <div style={{ fontSize:13, color:'#80848e', marginTop:4 }}>Корпоративный контур связи</div>
        </div>

        <div style={S.tabs}>
          {[['qr','QR-код'],['phone','Телефон'],['pass','Пароль']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'8px 4px', borderRadius:8, border:'none', background: tab===k ? '#26272b' : 'transparent', color: tab===k ? '#f2f3f5' : '#80848e', fontSize:13, fontWeight:500, cursor:'pointer' }}>{l}</button>
          ))}
        </div>

        {/* QR */}
        {tab==='qr' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, width:'100%' }}>
            <div style={{ fontSize:12, color:'#80848e', textAlign:'center', lineHeight:1.7 }}>Откройте Сигнум на телефоне<br/>и отсканируйте код</div>
            <div onClick={simulateQR} style={{ width:164, height:164, background:'#fff', borderRadius:12, padding:10, position:'relative', overflow:'hidden', cursor:'pointer' }}>
              <svg width="144" height="144" viewBox="0 0 144 144">
                <rect x="8" y="8" width="42" height="42" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/><rect x="17" y="17" width="24" height="24" rx="2" fill="#111"/>
                <rect x="94" y="8" width="42" height="42" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/><rect x="103" y="17" width="24" height="24" rx="2" fill="#111"/>
                <rect x="8" y="94" width="42" height="42" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/><rect x="17" y="103" width="24" height="24" rx="2" fill="#111"/>
                {[[62,8],[72,8],[62,18],[72,18],[82,18],[62,62],[72,62],[82,62],[62,72],[82,72],[62,82],[72,82],[8,62],[18,62],[28,62],[8,72],[28,72],[8,82],[18,82],[94,62],[104,62],[114,72],[94,82],[104,82],[94,104],[104,114],[114,104],[124,94],[124,114]].map(([x,y],i)=>(
                  <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill="#111"/>
                ))}
              </svg>
              {timer>0 && <div style={{ position:'absolute', left:10, right:10, height:2, background:'rgba(88,101,242,.6)', animation:'qrscan 3s ease-in-out infinite', top:10 }}/>}
              {qrState==='scan' && <div style={{ position:'absolute', inset:0, background:'rgba(88,101,242,.9)', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}><span style={{ fontSize:28 }}>📲</span><span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>Подтверждение...</span></div>}
              {qrState==='ok'   && <div style={{ position:'absolute', inset:0, background:'rgba(35,165,90,.9)', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}><span style={{ fontSize:28 }}>✅</span><span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>Вход выполнен</span></div>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ position:'relative', width:44, height:44 }}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#2a2b30" strokeWidth="3"/>
                  <circle cx="22" cy="22" r="18" fill="none" stroke={timer>40?'#5865f2':timer>15?'#f0a500':'#ed4245'} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} transform="rotate(-90 22 22)" strokeLinecap="round"/>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#f2f3f5' }}>{timer}</div>
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#b5bac1' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: qrState==='ok'?'#23a55a':qrState==='scan'?'#f0a500':'#4e5058' }}/>
                  {qrState==='ok'?'Вход выполнен':qrState==='scan'?'Ожидаем подтверждения...':'Ожидание сканирования'}
                </div>
                <div style={{ fontSize:10, color:'#4e5058', marginTop:2 }}>Защищено ЭЦП</div>
              </div>
            </div>
            <div style={{ width:'100%', background:'#1a1b1e', border:'1px solid rgba(255,255,255,.06)', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>📱</span>
              <div><div style={{ fontSize:12, fontWeight:500, color:'#dcddde' }}>iPhone 15 Pro</div><div style={{ fontSize:10, color:'#6d6f78', marginTop:1 }}>Face ID · Доверенное устройство</div></div>
              <span style={{ marginLeft:'auto', fontSize:10, padding:'2px 7px', borderRadius:999, background:'rgba(35,165,90,.12)', color:'#57c78a', border:'1px solid rgba(35,165,90,.2)' }}>Основной</span>
            </div>
          </div>
        )}

        {/* Phone */}
        {tab==='phone' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, width:'100%' }}>
            <input style={S.inp} value={phone} onChange={e=>setPhone(fmtPhone(e.target.value))} placeholder="+7 (___) ___-__-__" maxLength={18}/>
            {!otpSent
              ? <button style={{ ...S.btn, opacity: loading||phone.replace(/\D/g,'').length<11 ? .6:1 }} onClick={sendSMS} disabled={loading}>
                  {loading ? 'Отправка...' : 'Получить код'}
                </button>
              : <>
                  <div style={{ fontSize:12, color:'#80848e', textAlign:'center' }}>Код отправлен — введите 6 цифр:</div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                    {otp.map((v,i) => (
                      <input key={i} ref={el=>otpRefs.current[i]=el} value={v} maxLength={1} onChange={e=>handleOtp(i,e.target.value)}
                        style={{ width:42, height:48, background:'#1a1b1e', border:`1px solid ${v?'#23a55a':'rgba(255,255,255,.1)'}`, borderRadius:8, textAlign:'center', color:'#f2f3f5', fontSize:20, fontWeight:700, outline:'none' }}/>
                    ))}
                  </div>
                </>
            }
          </div>
        )}

        {/* Password */}
        {tab==='pass' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%' }}>
            <input style={S.inp} value={login} onChange={e=>setLogin(e.target.value)} placeholder="Email или логин" onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
            <input style={S.inp} value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Пароль" onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
            <button style={{ ...S.btn, opacity:loading?.6:1 }} onClick={doLogin} disabled={loading}>{loading?'Вход...':'Войти'}</button>
            <button onClick={() => setTab('qr')} style={{ width:'100%', padding:11, borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#80848e', fontSize:13, cursor:'pointer' }}>Войти через QR-код</button>
          </div>
        )}

        {error && <div style={S.err}>{error}</div>}
      </div>
      <style>{`@keyframes qrscan{0%{top:10px}50%{top:152px}100%{top:10px}}*{box-sizing:border-box}`}</style>
    </div>
  );
}
