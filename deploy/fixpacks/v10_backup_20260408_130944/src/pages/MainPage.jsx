// pages/MainPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { api, connectSocket } from '../api';

// ── Утилиты ──────────────────────────────────────────────────
const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
};
const avatar = (name = '') => name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const COLORS = ['#5865f2','#ed4245','#23a55a','#f0a500','#e91e63','#00bcd4','#9c27b0','#ff5722'];
const color = (id = '') => COLORS[id.charCodeAt(0) % COLORS.length];

// ── Компоненты ────────────────────────────────────────────────

function Avatar({ user, size = 32, speaking = false, onClick }) {
  const s = speaking;
  return (
    <div onClick={onClick} style={{ position: 'relative', flexShrink: 0, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color(user?.id),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#fff',
        outline: s ? '2px solid #23a55a' : 'none', outlineOffset: 1,
        animation: s ? 'speaking .7s ease-in-out infinite alternate' : 'none',
        overflow: 'hidden'
      }}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : avatar(user?.displayName || user?.username || '?')}
      </div>
    </div>
  );
}

function PresenceDot({ status, size = 10, border = '#1a1b1e' }) {
  const colors = { online: '#23a55a', offline: '#80848e', in_voice: '#5865f2', in_meeting: '#f0a500', speaking: '#23a55a' };
  return (
    <div style={{
      position: 'absolute', bottom: -1, right: -1,
      width: size, height: size, borderRadius: '50%',
      background: colors[status] || '#80848e',
      border: `2px solid ${border}`
    }}/>
  );
}

function Spinner() {
  return <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.1)', borderTop: '2px solid #5865f2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>;
}

export default function MainPage({ user, token, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [voiceState, setVoiceState] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState('members'); // members | ai | none
  const [showOverlay, setShowOverlay] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [deafOn, setDeafOn] = useState(false);
  const [aiMessages, setAiMessages] = useState([{ role: 'assistant', text: 'Привет! Я Сигнум AI. Могу суммаризировать переписку, писать черновики, отвечать на вопросы. Напишите @ai вопрос в чате.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [unread, setUnread] = useState({});
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const inputRef = useRef(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Загрузка комнат
  useEffect(() => {
    api.rooms().then(r => {
      const active = r.filter(x => !x.isArchived);
      setRooms(active);
      if (active.length && !activeRoom) setActiveRoom(active[0]);
    }).catch(() => {});
  }, []);

  // Загрузка сообщений при смене комнаты
  useEffect(() => {
    if (!activeRoom) return;
    setMessages([]);
    setLoading(true);
    api.messages(activeRoom.id).then(m => {
      setMessages(Array.isArray(m) ? m : m.messages || []);
      setUnread(u => ({ ...u, [activeRoom.id]: 0 }));
    }).catch(() => {}).finally(() => setLoading(false));

    // Участники
    if (activeRoom.kind === 'voice' || activeRoom.kind === 'meeting') {
      api.voiceState(activeRoom.id).then(s => setVoiceState(s)).catch(() => {});
    }
  }, [activeRoom?.id]);

  // Скролл вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket
  useEffect(() => {
    const ws = connectSocket(token, {
      onMessage: (msg) => {
        if (msg.type === 'message_created') {
          if (msg.roomId === activeRoom?.id) {
            setMessages(m => [...m, msg.message]);
          } else {
            setUnread(u => ({ ...u, [msg.roomId]: (u[msg.roomId] || 0) + 1 }));
          }
        }
        if (msg.type === 'voice_state_updated' && msg.roomId === activeRoom?.id) {
          setVoiceState(msg.state);
        }
      },
      onOpen: () => {},
      onClose: () => {},
    });
    wsRef.current = ws;
    return () => ws.close();
  }, [token, activeRoom?.id]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !activeRoom) return;
    setInput('');

    // @ai
    if (text.toLowerCase().startsWith('@ai')) {
      const q = text.slice(3).trim();
      if (panel === 'none') setPanel('ai');
      setAiMessages(m => [...m, { role: 'user', text: q }]);
      setAiLoading(true);
      try {
        const r = await fetch(`/api/ai/rooms/${activeRoom.id}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: q })
        });
        const d = await r.json();
        setAiMessages(m => [...m, { role: 'assistant', text: d.reply || d.error || 'Ошибка' }]);
      } catch { setAiMessages(m => [...m, { role: 'assistant', text: 'Ошибка AI' }]); }
      setAiLoading(false);
      return;
    }

    // Оптимистичное добавление
    const tempMsg = { id: 'tmp_' + Date.now(), content: text, userId: user?.id, user, createdAt: new Date().toISOString() };
    setMessages(m => [...m, tempMsg]);
    try {
      await api.sendMessage(activeRoom.id, text);
    } catch { showToast('Ошибка отправки', 'error'); }
  }

  async function joinVoice() {
    if (!activeRoom) return;
    try {
      await api.voiceJoin(activeRoom.id);
      const s = await api.voiceState(activeRoom.id);
      setVoiceState(s);
      setShowOverlay(true);
      showToast('Вы подключились к голосовому контуру');
    } catch (e) { showToast('Ошибка: ' + e.message, 'error'); }
  }

  async function leaveVoice() {
    if (!activeRoom) return;
    try { await api.voiceLeave(activeRoom.id); } catch {}
    setVoiceState(v => v ? { ...v, participants: v.participants?.filter(p => p.userId !== user?.id) } : v);
    setShowOverlay(false);
  }

  async function sendAI() {
    const text = aiInput.trim(); if (!text) return;
    setAiInput('');
    setAiMessages(m => [...m, { role: 'user', text }]);
    setAiLoading(true);
    try {
      const r = await fetch(`/api/ai/rooms/${activeRoom?.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text })
      });
      const d = await r.json();
      setAiMessages(m => [...m, { role: 'assistant', text: d.reply || 'Ошибка' }]);
    } catch { setAiMessages(m => [...m, { role: 'assistant', text: 'Ошибка AI' }]); }
    setAiLoading(false);
  }

  async function summarize() {
    if (!activeRoom) return;
    setAiLoading(true); setPanel('ai');
    try {
      const r = await fetch(`/api/ai/rooms/${activeRoom.id}/summarize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ limit: 50 })
      });
      const d = await r.json();
      setAiMessages(m => [...m, { role: 'assistant', text: '📋 Суммаризация:\n\n' + (d.summary || 'Нет данных') }]);
    } catch { setAiMessages(m => [...m, { role: 'assistant', text: 'Ошибка' }]); }
    setAiLoading(false);
  }

  // Группировка сообщений по дате и автору
  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameAuthor = prev && prev.userId === msg.userId && (new Date(msg.createdAt) - new Date(prev.createdAt)) < 300000;
    const sameDay = prev && fmtDate(prev.createdAt) === fmtDate(msg.createdAt);
    return [...acc, { ...msg, sameAuthor, showDate: !sameDay }];
  }, []);

  const textRooms = rooms.filter(r => r.kind === 'group' || r.kind === 'dm');
  const voiceRooms = rooms.filter(r => r.kind === 'voice');
  const meetingRooms = rooms.filter(r => r.kind === 'meeting');

  const voiceParticipants = voiceState?.participants || [];
  const inVoice = voiceParticipants.some(p => p.userId === user?.id);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0e0f11', fontFamily: 'system-ui,-apple-system,sans-serif', color: '#dcddde', overflow: 'hidden' }}>

      {/* ── RAIL (иконки серверов) ── */}
      <div style={{ width: 72, background: '#0e0f11', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 8, borderRight: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', cursor: 'pointer', transition: 'border-radius .2s' }}
          onMouseEnter={e => e.currentTarget.style.borderRadius = '12px'}
          onMouseLeave={e => e.currentTarget.style.borderRadius = '16px'}>С</div>
        <div style={{ width: 36, height: 1, background: 'rgba(255,255,255,.08)' }}/>
        {[['💬', 'Чат'], ['📋', 'Задачи'], ['⚙', 'Настройки']].map(([ic, title]) => (
          <div key={title} title={title} style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a1b1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', transition: 'border-radius .2s, background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderRadius = '14px'; e.currentTarget.style.background = '#5865f2'; }}
            onMouseLeave={e => { e.currentTarget.style.borderRadius = '50%'; e.currentTarget.style.background = '#1a1b1e'; }}>
            {ic}
          </div>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <div title="Выйти" onClick={onLogout} style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a1b1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderRadius = '14px'; e.currentTarget.style.background = '#ed4245'; }}
            onMouseLeave={e => { e.currentTarget.style.borderRadius = '50%'; e.currentTarget.style.background = '#1a1b1e'; }}>
            🚪
          </div>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{ width: 240, background: '#111214', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f2f3f5', flex: 1 }}>Контур Связи</span>
          <span style={{ color: '#80848e' }}>⌄</span>
        </div>

        {/* Search */}
        <div style={{ margin: '6px 8px', padding: '6px 10px', background: '#0e0f11', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, cursor: 'text' }}>
          <span style={{ color: '#6d6f78', fontSize: 12 }}>🔍</span>
          <span style={{ color: '#6d6f78', fontSize: 12 }}>Поиск</span>
        </div>

        {/* Rooms */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {textRooms.length > 0 && (
            <>
              <SidebarSection label="Текстовые" onAdd={() => showToast('Создать комнату')} />
              {textRooms.map(r => (
                <RoomItem key={r.id} room={r} active={activeRoom?.id === r.id} unread={unread[r.id] || 0}
                  icon="#" onClick={() => setActiveRoom(r)} />
              ))}
            </>
          )}
          {voiceRooms.length > 0 && (
            <>
              <SidebarSection label="Голосовые" onAdd={() => showToast('Создать голосовую')} />
              {voiceRooms.map(r => {
                const participants = (voiceState?.roomId === r.id ? voiceState.participants : []) || [];
                return (
                  <div key={r.id}>
                    <RoomItem room={r} active={activeRoom?.id === r.id} icon="🎙"
                      badge={participants.length > 0 ? `🎙${participants.length}` : null}
                      onClick={() => setActiveRoom(r)} />
                    {participants.map(p => (
                      <VoiceUserItem key={p.userId} participant={p} />
                    ))}
                  </div>
                );
              })}
            </>
          )}
          {meetingRooms.length > 0 && (
            <>
              <SidebarSection label="Собрания" onAdd={() => showToast('Создать собрание')} />
              {meetingRooms.map(r => (
                <RoomItem key={r.id} room={r} active={activeRoom?.id === r.id} icon="📋"
                  onClick={() => setActiveRoom(r)} />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar user={user} size={30} />
            <PresenceDot status="online" size={10} border="#111214" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f2f3f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || user?.username}</div>
            <div style={{ fontSize: 10, color: '#80848e' }}>{user?.role || 'Пользователь'}</div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <FooterBtn icon={micOn ? '🎤' : '🔇'} title={micOn ? 'Выкл. микрофон' : 'Вкл. микрофон'} onClick={() => setMicOn(v => !v)} />
            <FooterBtn icon="⚙" title="Настройки" onClick={() => showToast('Настройки')} />
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#161719' }}>
        {/* Header */}
        <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
          <span style={{ fontSize: 16, color: '#80848e' }}>{activeRoom?.kind === 'voice' ? '🎙' : activeRoom?.kind === 'meeting' ? '📋' : '#'}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f2f3f5' }}>{activeRoom?.name || 'Выберите комнату'}</span>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,.08)' }}/>
          <span style={{ fontSize: 12, color: '#80848e', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeRoom?.description || `${activeRoom?.kind === 'voice' ? 'Голосовой канал' : 'Текстовый канал'} · ${voiceParticipants.length > 0 ? `${voiceParticipants.length} в голосе` : 'Все оффлайн'}`}
          </span>
          <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
            {(activeRoom?.kind === 'voice' || activeRoom?.kind === 'meeting') && (
              <HeaderBtn icon={inVoice ? '📴' : '📞'} title={inVoice ? 'Покинуть голос' : 'Подключиться'}
                active={inVoice} onClick={inVoice ? leaveVoice : joinVoice} />
            )}
            <HeaderBtn icon="📌" title="Закреплённые" onClick={() => showToast('Закреплённые сообщения')} />
            <HeaderBtn icon="👥" title="Участники" active={panel === 'members'} onClick={() => setPanel(p => p === 'members' ? 'none' : 'members')} />
            <HeaderBtn icon="🤖" title="AI-ассистент" active={panel === 'ai'} onClick={() => setPanel(p => p === 'ai' ? 'none' : 'ai')} />
            <HeaderBtn icon="📺" title="Overlay" active={showOverlay} onClick={() => setShowOverlay(v => !v)} />
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0 8px' }}>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>}
          {!activeRoom && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#80848e' }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#f2f3f5' }}>Выберите комнату</div>
              <div style={{ fontSize: 13 }}>Выберите комнату в левой панели чтобы начать</div>
            </div>
          )}
          {groupedMessages.map((msg, i) => (
            <MessageItem key={msg.id || i} msg={msg} currentUserId={user?.id}
              onDelete={async () => {
                try { await api.deleteMessage(activeRoom.id, msg.id); setMessages(m => m.filter(x => x.id !== msg.id)); }
                catch { showToast('Ошибка', 'error'); }
              }} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        {activeRoom && (
          <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
            <div style={{ background: '#202124', borderRadius: 10, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,.08)', transition: 'border-color .15s' }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(88,101,242,.4)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'}>
              <button onClick={() => showToast('Прикрепить файл')} style={{ background: 'none', border: 'none', color: '#80848e', fontSize: 20, cursor: 'pointer', padding: 0, transition: 'color .1s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f2f3f5'} onMouseLeave={e => e.currentTarget.style.color = '#80848e'}>＋</button>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Написать в #${activeRoom.name}... (или @ai вопрос)`}
                rows={1} style={{ flex: 1, background: 'transparent', border: 'none', color: '#dcddde', fontSize: 13, resize: 'none', outline: 'none', minHeight: 20, maxHeight: 160, lineHeight: 1.5, fontFamily: 'inherit' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}/>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button style={{ background: 'none', border: 'none', color: '#80848e', fontSize: 16, cursor: 'pointer' }}>😊</button>
                <button onClick={sendMessage} style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() ? '#5865f2' : '#2a2b30', border: 'none', color: '#fff', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#4e5058', marginTop: 4, paddingLeft: 4 }}>
              Shift+Enter — новая строка · @ai вопрос — AI-ассистент
            </div>
          </div>
        )}
      </div>

      {/* ── MEMBERS PANEL ── */}
      {panel === 'members' && (
        <div style={{ width: 240, background: '#111214', borderLeft: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#80848e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Участники
            <span style={{ background: '#2a2b30', borderRadius: 999, padding: '1px 7px', fontSize: 10, color: '#b5bac1' }}>{rooms.find(r => r.id === activeRoom?.id)?.memberCount || 0}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 10px' }}>
            <MembersSection label="В сети" members={[user]} voiceParticipants={voiceParticipants} currentUserId={user?.id} onAction={showToast} />
          </div>
        </div>
      )}

      {/* ── AI PANEL ── */}
      {panel === 'ai' && (
        <div style={{ width: 280, background: '#111214', borderLeft: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f2f3f5' }}>Сигнум AI</div>
              <div style={{ fontSize: 10, color: '#80848e' }}>Ассистент · {activeRoom?.name || 'комната'}</div>
            </div>
            <button onClick={() => setPanel('none')} style={{ background: 'none', border: 'none', color: '#80848e', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ padding: '8px', display: 'flex', gap: 5, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            <AIQuickBtn onClick={summarize}>📋 Суммаризировать</AIQuickBtn>
            <AIQuickBtn onClick={() => { setAiMessages([]); showToast('История очищена'); }}>🗑 Очистить</AIQuickBtn>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aiMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: 10, color: '#4e5058', padding: '0 3px' }}>{m.role === 'user' ? 'Вы' : 'AI'}</span>
                <div style={{ maxWidth: '90%', padding: '7px 10px', borderRadius: m.role === 'user' ? '10px 10px 3px 10px' : '10px 10px 10px 3px', background: m.role === 'user' ? 'rgba(88,101,242,.2)' : 'rgba(255,255,255,.05)', fontSize: 12, lineHeight: 1.6, color: '#dcddde', whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading && <div style={{ display: 'flex', gap: 4, padding: '8px 10px', background: 'rgba(255,255,255,.05)', borderRadius: 10, width: 'fit-content' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#80848e', animation: `bounce .8s ${i*0.15}s ease-in-out infinite` }}/>)}
            </div>}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <textarea value={aiInput} onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
              placeholder="Спросить AI..." rows={1}
              style={{ flex: 1, background: 'rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '7px 9px', color: '#dcddde', fontSize: 12, outline: 'none', resize: 'none', minHeight: 30, maxHeight: 100, fontFamily: 'inherit' }}/>
            <button onClick={sendAI} style={{ width: 30, height: 30, borderRadius: 8, background: '#5865f2', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}>➤</button>
          </div>
        </div>
      )}

      {/* ── OVERLAY ── */}
      {showOverlay && <VoiceOverlay user={user} participants={voiceParticipants} micOn={micOn} deafOn={deafOn}
        onMic={() => setMicOn(v => !v)} onDeaf={() => setDeafOn(v => !v)}
        onLeave={leaveVoice} onClose={() => setShowOverlay(false)} />}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#313338', color: '#dbdee1', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 500, borderLeft: `4px solid ${toast.type === 'error' ? '#ed4245' : '#5865f2'}`, boxShadow: '0 4px 20px rgba(0,0,0,.4)', zIndex: 9999, animation: 'toast-in .2s ease', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes speaking { from{outline-color:rgba(35,165,90,.4)} to{outline-color:#23a55a} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
        @keyframes toast-in { from{transform:translateX(-50%) translateY(8px);opacity:0} to{transform:translateX(-50%);opacity:1} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }
        scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent;
      `}</style>
    </div>
  );
}

// ── Вспомогательные компоненты ────────────────────────────────

function SidebarSection({ label, onAdd }) {
  return (
    <div style={{ padding: '14px 8px 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6d6f78' }}>{label}</span>
      <button onClick={onAdd} style={{ background: 'none', border: 'none', color: '#6d6f78', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 2px', transition: 'color .1s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#b5bac1'} onMouseLeave={e => e.currentTarget.style.color = '#6d6f78'}>＋</button>
    </div>
  );
}

function RoomItem({ room, active, icon, badge, unread, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', margin: '1px 4px', position: 'relative',
        background: active ? 'rgba(255,255,255,.1)' : hov ? 'rgba(255,255,255,.05)' : 'transparent',
        color: active ? '#f2f3f5' : hov ? '#dcddde' : unread ? '#f2f3f5' : '#80848e' }}>
      {active && <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 4, height: 14, background: '#f2f3f5', borderRadius: '0 3px 3px 0' }}/>}
      <span style={{ fontSize: 15, flexShrink: 0, width: 18, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: 'rgba(88,101,242,.2)', color: '#9aa8fc' }}>{badge}</span>}
      {unread > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: '#ed4245', color: '#fff', minWidth: 16, textAlign: 'center' }}>{unread}</span>}
    </div>
  );
}

function VoiceUserItem({ participant }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px 3px 34px', borderRadius: 6, margin: '1px 4px', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: color(participant.userId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
        {participant.username?.[0]?.toUpperCase() || '?'}
      </div>
      <span style={{ fontSize: 12, color: '#80848e', flex: 1 }}>{participant.username || participant.displayName}</span>
      {!participant.isMuted && <span style={{ fontSize: 11, opacity: .7 }}>🎤</span>}
      {participant.isMuted && <span style={{ fontSize: 11, opacity: .4 }}>🔇</span>}
    </div>
  );
}

function MessageItem({ msg, currentUserId, onDelete }) {
  const [hov, setHov] = useState(false);
  const isMe = msg.userId === currentUserId;

  return (
    <>
      {msg.showDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 6px', fontSize: 11, fontWeight: 600, color: '#6d6f78' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }}/>
          {fmtDate(msg.createdAt)}
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }}/>
        </div>
      )}
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ padding: msg.sameAuthor ? '1px 16px' : '2px 16px', position: 'relative', background: hov ? 'rgba(255,255,255,.02)' : 'transparent' }}>
        {!msg.sameAuthor ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar user={msg.user || { id: msg.userId, displayName: msg.username }} size={38} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: color(msg.userId) }}>{msg.user?.displayName || msg.username || 'Пользователь'}</span>
                {msg.user?.role && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(88,101,242,.2)', color: '#9aa8fc' }}>{msg.user.role}</span>}
                <span style={{ fontSize: 11, color: '#6d6f78' }}>{fmt(msg.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, color: '#dcddde', lineHeight: 1.55, wordBreak: 'break-word' }}>{msg.content}</div>
            </div>
          </div>
        ) : (
          <div style={{ paddingLeft: 50, fontSize: 13, color: '#dcddde', lineHeight: 1.55, wordBreak: 'break-word' }}>
            {hov && <span style={{ position: 'absolute', left: 16, fontSize: 11, color: '#6d6f78', userSelect: 'none' }}>{fmt(msg.createdAt)}</span>}
            {msg.content}
          </div>
        )}
        {hov && (
          <div style={{ position: 'absolute', top: -10, right: 16, background: '#202124', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 2, display: 'flex', gap: 1, boxShadow: '0 4px 12px rgba(0,0,0,.3)', zIndex: 5 }}>
            {[['↩', 'Ответить'], ['😊', 'Реакция'], ['📌', 'Закрепить'], ...(isMe ? [['✏', 'Редактировать'], ['🗑', 'Удалить']] : [])].map(([ic, title]) => (
              <button key={title} title={title} onClick={ic === '🗑' ? onDelete : undefined}
                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: '#b5bac1', cursor: 'pointer', fontSize: 12, transition: 'background .1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = ic === '🗑' ? 'rgba(237,66,69,.15)' : 'rgba(255,255,255,.07)'; if (ic === '🗑') e.currentTarget.style.color = '#ed4245'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b5bac1'; }}>
                {ic}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MembersSection({ label, members, voiceParticipants, currentUserId, onAction }) {
  return (
    <>
      <div style={{ padding: '12px 8px 3px', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6d6f78' }}>
        {label} — {members.length}
      </div>
      {members.map(m => (
        <MemberRow key={m?.id} member={m} inVoice={voiceParticipants?.some(p => p.userId === m?.id)} isMe={m?.id === currentUserId} onAction={onAction} />
      ))}
    </>
  );
}

function MemberRow({ member, inVoice, isMe, onAction }) {
  const [hov, setHov] = useState(false);
  if (!member) return null;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', position: 'relative', background: hov ? 'rgba(255,255,255,.05)' : 'transparent' }}>
      <div style={{ position: 'relative' }}>
        <Avatar user={member} size={30} />
        <PresenceDot status={inVoice ? 'in_voice' : 'online'} size={9} border="#111214" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#dcddde', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
          {member.displayName || member.username}
          {isMe && <span style={{ fontSize: 9, color: '#5865f2', fontWeight: 600 }}>(вы)</span>}
        </div>
        <div style={{ fontSize: 10, color: '#6d6f78', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
          {inVoice && <span style={{ color: '#9aa8fc' }}>🎙 В голосе</span>}
          {!inVoice && <span>В сети</span>}
        </div>
      </div>
      {hov && !isMe && (
        <div style={{ display: 'flex', gap: 1 }}>
          {[['📣', 'Вызвать'], ['👤', 'Профиль']].map(([ic, t]) => (
            <button key={t} title={t} onClick={() => onAction(t)} style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: 'transparent', color: '#6d6f78', cursor: 'pointer', fontSize: 12 }}>
              {ic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderBtn({ icon, title, active, onClick }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: active ? 'rgba(255,255,255,.12)' : 'transparent', color: active ? '#f2f3f5' : '#80848e', cursor: 'pointer', fontSize: 15, transition: 'all .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#f2f3f5'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(255,255,255,.12)' : 'transparent'; e.currentTarget.style.color = active ? '#f2f3f5' : '#80848e'; }}>
      {icon}
    </button>
  );
}

function FooterBtn({ icon, title, onClick }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: '#80848e', cursor: 'pointer', fontSize: 14, transition: 'all .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#f2f3f5'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#80848e'; }}>
      {icon}
    </button>
  );
}

function AIQuickBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(88,101,242,.1)', border: '1px solid rgba(88,101,242,.2)', color: '#9aa8fc', fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,101,242,.2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(88,101,242,.1)'}>
      {children}
    </button>
  );
}

function VoiceOverlay({ user, participants, micOn, deafOn, onMic, onDeaf, onLeave, onClose }) {
  const [pos, setPos] = useState({ top: 14, right: 14 });
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);
  const dragStart = useRef(null);

  useEffect(() => {
    const onMove = e => {
      if (!dragging || !dragStart.current) return;
      setPos({ top: e.clientY - dragStart.current.y, left: e.clientX - dragStart.current.x, right: 'auto' });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  const style = { position: 'fixed', ...pos, width: 200, background: 'rgba(12,13,15,.94)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(255,255,255,.09)', overflow: 'hidden', zIndex: 1000 };

  return (
    <div ref={ref} style={style}>
      <div onMouseDown={e => { setDragging(true); const r = ref.current.getBoundingClientRect(); dragStart.current = { x: e.clientX - r.left, y: e.clientY - r.top }; }}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'move' }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>С</div>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#b5bac1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>В эфире · Сигнум</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6d6f78', cursor: 'pointer', fontSize: 13 }}>✕</button>
      </div>
      <div style={{ margin: '0 10px 7px', padding: '5px 8px', background: 'rgba(35,165,90,.07)', border: '1px solid rgba(35,165,90,.15)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#57c78a' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#23a55a' }}/>
        ЭЦП верифицирована
      </div>
      <div style={{ padding: '7px 10px 3px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#4e5058', marginBottom: 4 }}>Голосовой контур</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#dbdee1', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#23a55a', animation: 'pulse 2s ease-in-out infinite' }}/>
          Активный · {participants.length} участника
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '0 6px 6px' }}>
        {participants.map(p => (
          <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 4px', borderRadius: 6, cursor: 'pointer' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: color(p.userId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{(p.displayName || p.username || '?')[0].toUpperCase()}</div>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#dbdee1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName || p.username}</span>
            <span style={{ fontSize: 11, opacity: p.isMuted ? .3 : .8 }}>{p.isMuted ? '🔇' : '🎤'}</span>
          </div>
        ))}
        {participants.length === 0 && (
          <div style={{ padding: '4px 4px', fontSize: 11, color: '#4e5058', textAlign: 'center' }}>Никого нет</div>
        )}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '2px 10px' }}/>
      <div style={{ padding: '7px 10px', display: 'flex', gap: 5 }}>
        <OvBtn active={micOn} onClick={onMic}>{micOn ? '🎤 Мик' : '🔇 Мик'}</OvBtn>
        <OvBtn active={!deafOn} onClick={onDeaf}>{deafOn ? '🔇 Звук' : '🔈 Звук'}</OvBtn>
        <OvBtn danger onClick={onLeave}>☎</OvBtn>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

function OvBtn({ children, active, danger, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '5px 3px', borderRadius: 6, border: 'none', background: active ? 'rgba(88,101,242,.2)' : 'rgba(255,255,255,.06)', color: active ? '#9aa8fc' : '#b5bac1', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'background .15s' }}
      onMouseEnter={e => { if (danger) { e.currentTarget.style.background = 'rgba(237,66,69,.2)'; e.currentTarget.style.color = '#ed4245'; } else e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(88,101,242,.2)' : 'rgba(255,255,255,.06)'; e.currentTarget.style.color = active ? '#9aa8fc' : '#b5bac1'; }}>
      {children}
    </button>
  );
}
