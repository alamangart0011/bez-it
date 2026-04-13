import { useEffect, useMemo, useState } from 'react';
import { BRANDING_DEFAULTS } from './shared/brandingDefaults.js';

const C = { bg:'#0f141b', panel:'#151c24', panel2:'#1b2430', bd:'#283241', txt:'#e8edf5', sub:'#9fb0c3', acc:'#4b8cff', ok:'#16a34a', err:'#dc2626' };
const TOKEN_KEY = 'sg_token';
const tk = () => localStorage.getItem(TOKEN_KEY) || '';

async function api(method, path, body, token) {
  const r = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token || tk() ? { Authorization: `Bearer ${token || tk()}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json().catch(() => ({})) : await r.text().catch(() => '');
  if (!r.ok) throw new Error((data && (data.detail || data.message || data.error)) || `${r.status} ${path}`);
  return data;
}

const A = {
  login: (login, password) => api('POST', '/api/auth/login', { login, email: login, password }),
  me: (token) => api('GET', '/api/me', undefined, token),
  rooms: () => api('GET', '/api/rooms'),
  createRoom: (name, kind) => api('POST', '/api/rooms', { name, kind }),
  messages: (roomId) => api('GET', `/api/rooms/${roomId}/messages`),
  members: (roomId) => api('GET', `/api/rooms/${roomId}/members`),
  send: (roomId, text) => api('POST', `/api/rooms/${roomId}/messages`, { text, content: text }),
  del: (roomId, id) => api('DELETE', `/api/rooms/${roomId}/messages/${id}`),
  voiceState: (roomId) => api('GET', `/api/voice/rooms/${roomId}/state`),
  voiceJoin: (roomId) => api('POST', `/api/voice/rooms/${roomId}/join`, {}),
  voiceLeave: (roomId) => api('POST', `/api/voice/rooms/${roomId}/leave`, {}),
  voiceSelf: (roomId, body) => api('PATCH', `/api/voice/rooms/${roomId}/self`, body),
};

function nu(u) {
  if (!u) return null;
  return {
    id: u.id || u.userId || u.user_id || '',
    name: u.displayName || u.display_name || u.fullName || u.full_name || u.username || (u.email ? u.email.split('@')[0] : 'Пользователь'),
    email: u.email || '',
    role: u.role || u.systemRole || '',
  };
}

function nm(m) {
  return {
    id: m.id || m._id || '',
    text: m.content || m.text || m.body || '',
    createdAt: m.createdAt || m.created_at || m.timestamp || new Date().toISOString(),
    user: nu(m.user || m.author || m.sender || { id: m.userId || m.user_id, displayName: m.displayName || m.display_name, username: m.username, email: m.email, role: m.userRole || m.role }),
  };
}

const fmtTime = (v) => { try { return new Date(v).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' }); } catch { return ''; } };
const kindIcon = (k) => k === 'voice' ? '🎙' : k === 'meeting' ? '📋' : '#';

function Btn({ children, onClick, disabled, active, danger }) {
  return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ border:'1px solid', borderColor:danger?C.err:active?C.acc:C.bd, background:danger?C.err:active?C.acc:C.panel2, color:'#fff', borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.6:1 }}>{children}</button>;
}

function Auth({ onDone }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!login.trim() || !password.trim()) { setError('Заполните логин и пароль.'); return; }
    setBusy(true); setError('');
    try {
      const data = await A.login(login.trim(), password);
      const token = data.accessToken || data.token || '';
      if (!token) throw new Error('Токен не получен.');
      localStorage.setItem(TOKEN_KEY, token);
      onDone(token, data.user || null);
    } catch (e) { setError(e.message || 'Ошибка входа'); } finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:C.bg, color:C.txt, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <div style={{ width:420, maxWidth:'92vw', background:C.panel, border:`1px solid ${C.bd}`, borderRadius:20, padding:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:C.acc, color:'#fff', display:'grid', placeItems:'center', fontSize:24, fontWeight:800 }}>С</div>
          <div>
            <div style={{ fontSize:24, fontWeight:800 }}>{BRANDING_DEFAULTS.appName}</div>
            <div style={{ fontSize:13, color:C.sub }}>{BRANDING_DEFAULTS.organizationName}</div>
          </div>
        </div>
        <div style={{ display:'grid', gap:12 }}>
          <input value={login} onChange={(e)=>setLogin(e.target.value)} placeholder="Email или логин" onKeyDown={(e)=>e.key==='Enter'&&submit()} style={{ width:'100%', background:C.panel2, border:`1px solid ${C.bd}`, color:C.txt, borderRadius:12, padding:'12px 14px', outline:'none' }} />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Пароль" onKeyDown={(e)=>e.key==='Enter'&&submit()} style={{ width:'100%', background:C.panel2, border:`1px solid ${C.bd}`, color:C.txt, borderRadius:12, padding:'12px 14px', outline:'none' }} />
          <Btn onClick={submit} active disabled={busy}>{busy ? 'Вход...' : 'Войти'}</Btn>
          {error ? <div style={{ color:'#fff', background:'rgba(220,38,38,.2)', border:`1px solid ${C.err}`, borderRadius:12, padding:'10px 12px', fontSize:13 }}>{error}</div> : null}
          <div style={{ fontSize:12, color:C.sub }}>Room-based baseline · единый активный контур</div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, rooms, currentRoomId, setCurrentRoomId, onCreate, onRefresh, onLogout }) {
  const groups = useMemo(() => ({
    text: rooms.filter((r) => !['voice', 'meeting'].includes(r.kind)),
    voice: rooms.filter((r) => r.kind === 'voice'),
    meeting: rooms.filter((r) => r.kind === 'meeting'),
  }), [rooms]);

  function section(title, kind, items) {
    return (
      <div style={{ marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', color:C.sub, fontWeight:700 }}>{title}</div>
          <button onClick={()=>onCreate(kind)} style={{ background:'transparent', color:C.sub, border:'none', fontSize:18, cursor:'pointer' }}>＋</button>
        </div>
        <div style={{ display:'grid', gap:4 }}>
          {items.map((room) => {
            const active = room.id === currentRoomId;
            return (
              <button key={room.id} onClick={()=>setCurrentRoomId(room.id)} style={{ textAlign:'left', border:`1px solid ${active?C.acc:'transparent'}`, background:active?'rgba(75,140,255,.18)':'transparent', color:active?'#fff':C.txt, borderRadius:10, padding:'9px 10px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:18, textAlign:'center' }}>{kindIcon(room.kind)}</span>
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13, fontWeight:600 }}>{room.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside style={{ borderRight:`1px solid ${C.bd}`, background:C.panel, padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:C.acc, display:'grid', placeItems:'center', fontWeight:800, fontSize:20 }}>С</div>
        <div>
          <div style={{ fontSize:20, fontWeight:800 }}>{BRANDING_DEFAULTS.appName}</div>
          <div style={{ fontSize:12, color:C.sub }}>{BRANDING_DEFAULTS.organizationName}</div>
        </div>
      </div>
      {section('Текстовые комнаты', 'group', groups.text)}
      {section('Голосовые комнаты', 'voice', groups.voice)}
      {section('Собрания', 'meeting', groups.meeting)}
      <div style={{ marginTop:18, paddingTop:18, borderTop:`1px solid ${C.bd}` }}>
        <div style={{ fontSize:13, fontWeight:700 }}>{user?.name}</div>
        <div style={{ fontSize:12, color:C.sub }}>{user?.email || user?.role || 'Пользователь'}</div>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <Btn onClick={onRefresh}>Обновить</Btn>
          <Btn onClick={onLogout} danger>Выйти</Btn>
        </div>
      </div>
    </aside>
  );
}

function Main({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [joinedVoice, setJoinedVoice] = useState(false);
  const [muted, setMuted] = useState(false);

  const currentRoom = useMemo(() => rooms.find((room) => room.id === currentRoomId) || null, [rooms, currentRoomId]);

  function flash(message) {
    setNote(message);
    window.clearTimeout(flash.timer);
    flash.timer = window.setTimeout(() => setNote(''), 2600);
  }

  async function loadRooms(reset = false) {
    const raw = await A.rooms();
    const list = Array.isArray(raw) ? raw : raw.rooms || [];
    setRooms(list);
    if (reset || !currentRoomId || !list.some((room) => room.id === currentRoomId)) setCurrentRoomId(list[0]?.id || '');
    return list;
  }

  async function loadRoom(roomId) {
    if (!roomId) return;
    const room = rooms.find((r) => r.id === roomId) || null;
    const [rm, mm, vv] = await Promise.all([
      A.messages(roomId).catch(() => []),
      A.members(roomId).catch(() => []),
      room && ['voice', 'meeting'].includes(room.kind) ? A.voiceState(roomId).catch(() => null) : Promise.resolve(null),
    ]);
    const nextMessages = (Array.isArray(rm) ? rm : rm.messages || []).map(nm);
    const nextMembers = (Array.isArray(mm) ? mm : mm.members || []).map(nu).filter(Boolean);
    const nextParticipants = vv ? vv.participants || vv.users || [] : [];
    setMessages(nextMessages);
    setMembers(nextMembers);
    setParticipants(nextParticipants);
    setJoinedVoice(nextParticipants.some((item) => (item.userId || item.id) === user?.id));
    setMuted(Boolean(nextParticipants.find((item) => (item.userId || item.id) === user?.id)?.isMuted));
  }

  useEffect(() => { loadRooms(true).catch((e) => flash(e.message || 'Не удалось загрузить комнаты')); }, []);
  useEffect(() => { if (currentRoomId) loadRoom(currentRoomId).catch((e) => flash(e.message || 'Не удалось загрузить комнату')); }, [currentRoomId, rooms]);
  useEffect(() => {
    const id = window.setInterval(() => {
      loadRooms(false).catch(() => {});
      if (currentRoomId) loadRoom(currentRoomId).catch(() => {});
    }, 7000);
    return () => window.clearInterval(id);
  }, [currentRoomId, rooms]);

  async function createRoom(kind) {
    const name = window.prompt('Название комнаты');
    if (!name || !name.trim()) return;
    try {
      const created = await A.createRoom(name.trim(), kind);
      const room = created.room || created;
      await loadRooms(true);
      if (room?.id) setCurrentRoomId(room.id);
      flash('Комната создана');
    } catch (e) { flash(e.message || 'Ошибка создания комнаты'); }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || !currentRoomId || busy) return;
    setBusy(true);
    try {
      await A.send(currentRoomId, text);
      setInput('');
      await loadRoom(currentRoomId);
    } catch (e) { flash(e.message || 'Ошибка отправки'); } finally { setBusy(false); }
  }

  async function deleteMessage(messageId) {
    if (!currentRoomId || !messageId) return;
    try { await A.del(currentRoomId, messageId); await loadRoom(currentRoomId); } catch (e) { flash(e.message || 'Ошибка удаления'); }
  }

  async function toggleVoice() {
    if (!currentRoom) return;
    try {
      if (joinedVoice) await A.voiceLeave(currentRoom.id); else await A.voiceJoin(currentRoom.id);
      await loadRoom(currentRoom.id);
    } catch (e) { flash(e.message || 'Ошибка голосового контура'); }
  }

  async function toggleMute() {
    if (!currentRoom || !joinedVoice) return;
    try {
      await A.voiceSelf(currentRoom.id, { isMuted: !muted });
      await loadRoom(currentRoom.id);
    } catch (e) { flash(e.message || 'Ошибка микрофона'); }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.txt, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <div style={{ display:'grid', gridTemplateColumns:'280px minmax(0,1fr) 280px', minHeight:'100vh' }}>
        <Sidebar user={user} rooms={rooms} currentRoomId={currentRoomId} setCurrentRoomId={setCurrentRoomId} onCreate={createRoom} onRefresh={()=>currentRoomId&&loadRoom(currentRoomId)} onLogout={onLogout} />
        <main style={{ display:'grid', gridTemplateRows:'auto 1fr auto', minWidth:0 }}>
          <header style={{ borderBottom:`1px solid ${C.bd}`, background:C.panel, padding:'16px 18px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:18 }}>{kindIcon(currentRoom?.kind)}</div>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:18, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentRoom?.name || 'Комната не выбрана'}</div>
              <div style={{ fontSize:12, color:C.sub }}>{currentRoom ? (currentRoom.kind === 'voice' ? 'Голосовая' : currentRoom.kind === 'meeting' ? 'Собрание' : 'Текстовая') : 'Нет активной комнаты'}</div>
            </div>
            {currentRoom && ['voice', 'meeting'].includes(currentRoom.kind) ? (
              <>
                <Btn onClick={toggleVoice} active={joinedVoice}>{joinedVoice ? 'Покинуть голос' : 'Войти в голос'}</Btn>
                <Btn onClick={toggleMute} disabled={!joinedVoice}>{muted ? 'Размьютить' : 'Замьютить'}</Btn>
              </>
            ) : null}
          </header>

          <section style={{ overflowY:'auto', padding:18 }}>
            {!currentRoom ? (
              <div style={{ color:C.sub, fontSize:14 }}>Выберите комнату слева.</div>
            ) : messages.length === 0 ? (
              <div style={{ color:C.sub, fontSize:14 }}>Сообщений пока нет.</div>
            ) : (
              messages.map((m) => {
                const mine = m.user?.id === user?.id;
                return (
                  <div key={m.id} style={{ display:'flex', justifyContent:mine?'flex-end':'flex-start', marginBottom:10 }}>
                    <div style={{ maxWidth:'82%', background:mine?'rgba(75,140,255,.18)':C.panel, border:`1px solid ${mine?'rgba(75,140,255,.45)':C.bd}`, borderRadius:14, padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <div style={{ fontWeight:700, fontSize:12 }}>{m.user?.name || 'Пользователь'}</div>
                        <div style={{ color:C.sub, fontSize:11 }}>{fmtTime(m.createdAt)}</div>
                        {mine ? <button onClick={()=>deleteMessage(m.id)} style={{ marginLeft:'auto', background:'transparent', border:'none', color:C.sub, cursor:'pointer', fontSize:11 }}>удалить</button> : null}
                      </div>
                      <div style={{ whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:14, lineHeight:1.5 }}>{m.text}</div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <footer style={{ borderTop:`1px solid ${C.bd}`, background:C.panel, padding:16 }}>
            <div style={{ display:'flex', gap:12 }}>
              <textarea
                rows={1}
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                onKeyDown={(e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={currentRoom ? `Сообщение в ${currentRoom.name}` : 'Выберите комнату'}
                style={{ flex:1, resize:'none', background:C.panel2, border:`1px solid ${C.bd}`, color:C.txt, borderRadius:14, padding:'12px 14px', outline:'none', minHeight:46 }}
              />
              <Btn onClick={sendMessage} active disabled={!currentRoom || !input.trim() || busy}>Отправить</Btn>
            </div>
            {note ? <div style={{ marginTop:10, fontSize:12, color:C.ok }}>{note}</div> : null}
          </footer>
        </main>

        <aside style={{ borderLeft:`1px solid ${C.bd}`, background:C.panel, padding:18 }}>
          <div style={{ fontSize:12, letterSpacing:'.08em', textTransform:'uppercase', color:C.sub, fontWeight:700, marginBottom:14 }}>Участники комнаты</div>
          <div style={{ display:'grid', gap:8, marginBottom:18 }}>
            {members.length ? members.map((member) => {
              const inVoice = participants.some((item) => (item.userId || item.id) === member.id);
              return (
                <div key={member.id} style={{ background:C.panel2, border:`1px solid ${C.bd}`, borderRadius:12, padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {member.name}{member.id === user?.id ? ' (вы)' : ''}
                      </div>
                      <div style={{ fontSize:12, color:C.sub }}>{member.role || member.email || 'Пользователь'}</div>
                    </div>
                    <div style={{ fontSize:11, color:inVoice?C.ok:C.sub }}>{inVoice ? 'в голосе' : 'в комнате'}</div>
                  </div>
                </div>
              );
            }) : <div style={{ color:C.sub, fontSize:13 }}>Нет данных по участникам.</div>}
          </div>
          {currentRoom && ['voice', 'meeting'].includes(currentRoom.kind) ? (
            <>
              <div style={{ fontSize:12, letterSpacing:'.08em', textTransform:'uppercase', color:C.sub, fontWeight:700, marginBottom:14 }}>Голосовой контур</div>
              <div style={{ display:'grid', gap:8 }}>
                {participants.length ? participants.map((item, index) => (
                  <div key={item.userId || item.id || index} style={{ background:C.panel2, border:`1px solid ${C.bd}`, borderRadius:12, padding:'10px 12px' }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{item.displayName || item.username || item.userId || 'Участник'}</div>
                    <div style={{ fontSize:12, color:C.sub }}>{item.isMuted ? 'микрофон выключен' : 'микрофон включён'}</div>
                  </div>
                )) : <div style={{ color:C.sub, fontSize:13 }}>В голосовом контуре пока никого нет.</div>}
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = tk();
    if (!token) { setState('auth'); return; }
    A.me(token).then((raw) => { setUser(nu(raw.user || raw)); setState('main'); }).catch(() => { localStorage.removeItem(TOKEN_KEY); setState('auth'); });
  }, []);

  function onAuth(token, rawUser) {
    if (rawUser) { setUser(nu(rawUser)); setState('main'); return; }
    A.me(token).then((raw) => { setUser(nu(raw.user || raw)); setState('main'); }).catch(() => { localStorage.removeItem(TOKEN_KEY); setState('auth'); });
  }

  function onLogout() { localStorage.removeItem(TOKEN_KEY); setUser(null); setState('auth'); }

  if (state === 'loading') return <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:C.bg, color:C.txt, fontFamily:'system-ui,-apple-system,sans-serif' }}>Загрузка контура…</div>;
  if (state === 'auth') return <Auth onDone={onAuth} />;
  return <Main user={user} onLogout={onLogout} />;
}
