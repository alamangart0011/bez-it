import { useEffect, useState } from 'react';

export function getInviteTokenFromPathname(pathname = '') {
  if (!pathname.startsWith('/invite/')) return '';
  return decodeURIComponent(pathname.split('/invite/')[1] || '').trim();
}

export function AuthSplash({ C, label = 'Загрузка...' }) {
  return (
    <div style={{ height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>С</div>
      <div style={{ width: 28, height: 28, border: `3px solid ${C.bg3}`, borderTop: `3px solid ${C.acc}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 13, color: C.txt3 }}>{label}</div>
    </div>
  );
}

export function InviteAcceptPage({ token, onAuth, A, C, Inp, Btn }) {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [err, setErr] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    A.inviteInfo(token)
      .then((data) => {
        if (!mounted) return;
        setInvite(data);
        const seed = (data?.email || '').split('@')[0] || '';
        setDisplayName(seed);
        setUsername(seed);
      })
      .catch(() => {
        if (mounted) setErr('Приглашение недействительно или истекло');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [token, A]);

  async function submit() {
    if (!displayName || !username || !password || !confirmPassword) {
      setErr('Заполните все поля');
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      const data = await A.acceptInvite({ token, displayName, username, password, confirmPassword });
      if (data?.accessToken) {
        localStorage.setItem('sg_token', data.accessToken);
        onAuth(data.accessToken, data.user);
        return;
      }
      setErr('Не удалось принять приглашение');
    } catch (error) {
      setErr(error?.message || 'Ошибка принятия приглашения');
    }
    setSubmitting(false);
  }

  if (loading) {
    return <AuthSplash C={C} label="Проверка приглашения..." />;
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ background: C.bg1, borderRadius: 16, padding: '36px 32px', width: 420, maxWidth: '92vw', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 28px rgba(0,0,0,.1)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>С</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.txt }}>Принять приглашение</div>
          <div style={{ fontSize: 13, color: C.txt3, marginTop: 4 }}>
            Почта: {invite?.email || '—'} · Роль: {invite?.role || 'member'}
          </div>
        </div>
        <Inp value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ФИО" autoFocus />
        <Inp value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Логин" />
        <Inp value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" type="password" />
        <Inp value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повтор пароля" type="password" />
        <Btn variant="primary" onClick={submit} disabled={submitting} sx={{ width: '100%' }}>
          {submitting ? 'Создание...' : 'Принять приглашение'}
        </Btn>
        {err && (
          <div style={{ color: C.red, fontSize: 12, textAlign: 'center', width: '100%', padding: '8px 12px', background: `${C.red}10`, borderRadius: 6, border: `1px solid ${C.red}30` }}>
            ⚠️ {err}
          </div>
        )}
      </div>
    </div>
  );
}

export function SessionsModal({ user, A, C, Modal, Inp, Btn, onClose, onToast }) {
  const [data, setData] = useState({ sessions: [], history: [], currentSessionId: null });
  const [loading, setLoading] = useState(true);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  async function load() {
    setLoading(true);
    try {
      setData(await A.sessions());
    } catch {
      onToast?.('Ошибка загрузки устройств', 'error');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(id) {
    try {
      await A.revokeSession(id);
      onToast?.('Устройство отключено');
      load();
    } catch {
      onToast?.('Ошибка отключения', 'error');
    }
  }

  async function logoutOthers() {
    try {
      await A.logoutAll(true);
      onToast?.('Остальные устройства отключены');
      load();
    } catch {
      onToast?.('Ошибка logout-all', 'error');
    }
  }

  async function changePassword() {
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      onToast?.('Заполните пароли', 'error');
      return;
    }
    if (pwd.next !== pwd.confirm) {
      onToast?.('Пароли не совпадают', 'error');
      return;
    }
    try {
      await A.changePassword(pwd.current, pwd.next);
      onToast?.('Пароль обновлён', 'success');
      setPwd({ current: '', next: '', confirm: '' });
      load();
    } catch {
      onToast?.('Ошибка смены пароля', 'error');
    }
  }

  const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
  const history = Array.isArray(data?.history) ? data.history : [];

  return (
    <Modal title="Безопасность и устройства" onClose={onClose} width={760}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.txt3, textTransform: 'uppercase' }}>Активные устройства</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {loading && <div style={{ fontSize: 13, color: C.txt3 }}>Загрузка...</div>}
            {!loading && sessions.length === 0 && <div style={{ fontSize: 13, color: C.txt3 }}>Сессии не найдены</div>}
            {!loading && sessions.map((session) => {
              const isCurrent = Boolean(session.isCurrent || session.id === data.currentSessionId);
              const ua = session.userAgent || 'Устройство без подписи';
              const icon = /iphone|android/i.test(ua) ? '📱' : /mac|windows|linux/i.test(ua) ? '💻' : '🖥️';
              return (
                <div key={session.id} style={{ border: `1px solid ${C.brd}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 18 }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
                      {ua} {isCurrent && <span style={{ color: C.acc }}>· текущее</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.txt3 }}>
                      IP: {session.ipAddress || '—'} · Создано: {session.createdAt ? new Date(session.createdAt).toLocaleString('ru') : '—'} · До: {session.expiresAt ? new Date(session.expiresAt).toLocaleString('ru') : '—'}
                    </div>
                  </div>
                  {!isCurrent && <Btn variant="ghost" small onClick={() => revoke(session.id)}>Отключить</Btn>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: C.txt3 }}>Пользователь: {user?.displayName || user?.email || '—'}</div>
            <Btn variant="danger" small onClick={logoutOthers}>Отключить остальные устройства</Btn>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.txt3, textTransform: 'uppercase', marginTop: 8 }}>История auth</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
            {history.length === 0 && <div style={{ fontSize: 12, color: C.txt3 }}>Пока пусто</div>}
            {history.map((item, idx) => (
              <div key={`${item.createdAt || idx}-${idx}`} style={{ border: `1px solid ${C.brd}`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>{item.action || 'auth.event'}</div>
                <div style={{ fontSize: 11, color: C.txt3 }}>{item.createdAt ? new Date(item.createdAt).toLocaleString('ru') : '—'} · {item.result || 'ok'}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.txt3, textTransform: 'uppercase' }}>Смена пароля</div>
          <Inp value={pwd.current} onChange={(e) => setPwd((v) => ({ ...v, current: e.target.value }))} placeholder="Текущий пароль" type="password" />
          <Inp value={pwd.next} onChange={(e) => setPwd((v) => ({ ...v, next: e.target.value }))} placeholder="Новый пароль" type="password" />
          <Inp value={pwd.confirm} onChange={(e) => setPwd((v) => ({ ...v, confirm: e.target.value }))} placeholder="Повтор нового пароля" type="password" />
          <Btn variant="primary" onClick={changePassword}>Обновить пароль</Btn>
          <div style={{ fontSize: 12, color: C.txt3, lineHeight: 1.6 }}>
            Текущая реализация использует active auth sessions как управляемые устройства. Этого достаточно для MVP до отдельного phone-device слоя.
          </div>
        </div>
      </div>
    </Modal>
  );
}
