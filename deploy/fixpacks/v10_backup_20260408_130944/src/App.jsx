// App.jsx
import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import { api } from './api';

export default function App() {
  const [state, setState] = useState('loading'); // loading | auth | main
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('sg_token');
    if (!t) { setState('auth'); return; }
    api.me(t)
      .then(u => { setUser(u); setToken(t); setState('main'); })
      .catch(() => { localStorage.removeItem('sg_token'); setState('auth'); });
  }, []);

  function onAuth(tok, u) {
    setToken(tok);
    setUser(u);
    // Если user не пришёл из login — загружаем /api/me
    if (u) { setState('main'); return; }
    api.me(tok).then(me => { setUser(me); setState('main'); }).catch(() => setState('auth'));
  }

  function onLogout() {
    localStorage.removeItem('sg_token');
    setUser(null); setToken(''); setState('auth');
  }

  if (state === 'loading') return (
    <div style={{ height: '100vh', background: '#0e0f11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>С</div>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,.1)', borderTop: '3px solid #5865f2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (state === 'auth') return <AuthPage onAuth={onAuth} />;

  return <MainPage user={user} token={token} onLogout={onLogout} />;
}
