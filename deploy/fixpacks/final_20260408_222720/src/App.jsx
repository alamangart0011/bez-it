import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import { api, normalizeUser } from './api';

export default function App() {
  const [state, setState] = useState('loading');
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('sg_token');
    if (!t) { setState('auth'); return; }
    api.me(t)
      .then(raw => {
        const u = normalizeUser(raw.user || raw);
        setUser(u); setToken(t); setState('main');
      })
      .catch(() => { localStorage.removeItem('sg_token'); setState('auth'); });
  }, []);

  function onAuth(tok, rawUser) {
    setToken(tok);
    if (rawUser) { setUser(normalizeUser(rawUser)); setState('main'); return; }
    api.me(tok)
      .then(raw => { setUser(normalizeUser(raw.user||raw)); setState('main'); })
      .catch(() => setState('auth'));
  }

  if (state === 'loading') return (
    <div style={{ height:'100vh', background:'#0e0f11', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, background:'#5865f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff' }}>С</div>
      <div style={{ width:28, height:28, border:'3px solid rgba(255,255,255,.08)', borderTop:'3px solid #5865f2', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );

  if (state === 'auth') return <AuthPage onAuth={onAuth}/>;
  return <MainPage user={user} token={token} onLogout={() => { localStorage.removeItem('sg_token'); setState('auth'); }}/>;
}
