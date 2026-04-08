// src/pages/MainPage.jsx  — V10 Activity Panel
import { useState, useEffect, useRef, useCallback } from 'react';
import { api, normalizeUser, normalizeMsg, connectWS } from '../api';

// ── палитра цветов аватаров ─────────────────────────────────
const COLORS = ['#5865f2','#ed4245','#23a55a','#f0a500','#e91e63','#00bcd4','#9c27b0','#ff5722','#795548','#607d8b'];
const uidColor = id => COLORS[(id||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % COLORS.length];

// ── утилиты ────────────────────────────────────────────────
const initials = name => (name||'?').trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2);
const fmtTime  = iso => new Date(iso).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
const fmtDate  = iso => {
  const d=new Date(iso), t=new Date();
  if (d.toDateString()===t.toDateString()) return 'Сегодня';
  const y=new Date(t); y.setDate(t.getDate()-1); if (d.toDateString()===y.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru',{day:'numeric',month:'long'});
};

// ── Мини-компоненты ──────────────────────────────────────────
function Av({ user, size=32, ring=false, onClick }) {
  const name = user?.displayName || user?.username || '?';
  const uid  = user?.id || name;
  return (
    <div onClick={onClick} title={name} style={{ position:'relative', flexShrink:0, cursor:onClick?'pointer':'default' }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background: uidColor(uid),
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: Math.round(size*.38), fontWeight:700, color:'#fff', overflow:'hidden',
        outline: ring ? '2px solid #23a55a' : 'none', outlineOffset:1,
      }}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
          : initials(name)}
      </div>
    </div>
  );
}

function StatusDot({ status, border='#111214', size=9 }) {
  const c = { online:'#23a55a', offline:'#80848e', in_voice:'#5865f2', in_meeting:'#f0a500', busy:'#ed4245' };
  return <div style={{ position:'absolute', bottom:-1, right:-1, width:size, height:size, borderRadius:'50%', background:c[status]||'#80848e', border:`2px solid ${border}` }}/>;
}

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:'relative' }} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show && <div style={{ position:'absolute', right:'calc(100% + 8px)', top:'50%', transform:'translateY(-50%)', background:'#18191c', color:'#dcddde', fontSize:12, fontWeight:600, padding:'5px 10px', borderRadius:6, whiteSpace:'nowrap', zIndex:100, pointerEvents:'none' }}>{text}</div>}
    </div>
  );
}

function IBtn({ icon, title, active, danger, onClick, badge }) {
  const [h,setH]=useState(false);
  return (
    <Tooltip text={title}>
      <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{ position:'relative', width:30, height:30, borderRadius:6, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
          background: h||active ? (danger?'rgba(237,66,69,.2)':'rgba(255,255,255,.1)') : 'transparent',
          color: h||active ? (danger?'#ed4245':'#f2f3f5') : '#80848e', transition:'all .1s' }}>
        {icon}
        {badge>0 && <div style={{ position:'absolute', top:2, right:2, width:14, height:14, borderRadius:'50%', background:'#ed4245', fontSize:8, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #111214' }}>{badge>9?'9+':badge}</div>}
      </div>
    </Tooltip>
  );
}

// ══════════════════════════════════════════════════════════════
export default function MainPage({ user, token, onLogout }) {
  const [rooms,      setRooms]      = useState([]);
  const [activeRoom, setActive]     = useState(null);
  const [msgs,       setMsgs]       = useState([]);
  const [members,    setMembers]    = useState([]);
  const [voiceMap,   setVoiceMap]   = useState({}); // roomId → participants[]
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [rightPanel, setRight]      = useState('members'); // members | ai | none
  const [overlay,    setOverlay]    = useState(false);
  const [micOn,      setMic]        = useState(true);
  const [deafOn,     setDeaf]       = useState(false);
  const [aiMsgs,     setAiMsgs]     = useState([{role:'assistant',text:'Привет! Я Сигнум AI.\n\n📋 @ai суммаризировать — краткое резюме переписки\n✍️ @ai черновик — черновик ответа\n❓ @ai <вопрос> — любой вопрос по комнате'}]);
  const [aiInput,    setAiInput]    = useState('');
  const [aiLoading,  setAiLoad]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [unread,     setUnread]     = useState({});
  const [search,     setSearch]     = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [inVoice,    setInVoice]    = useState(false);

  const msgEnd   = useRef(null);
  const inputRef = useRef(null);
  const wsClose  = useRef(null);

  // ── toast хелпер ──────────────────────────────────────────
  const toast$ = useCallback((msg, type='info', dur=3000) => {
    setToast({ msg, type }); setTimeout(() => setToast(null), dur);
  }, []);

  // ── загрузка комнат ────────────────────────────────────────
  useEffect(() => {
    api.rooms().then(raw => {
      const list = (Array.isArray(raw) ? raw : raw.rooms||[]).filter(r=>!r.isArchived&&!r.is_archived);
      setRooms(list);
      if (list.length && !activeRoom) setActive(list[0]);
    }).catch(() => toast$('Ошибка загрузки комнат','error'));
  }, []);

  // ── загрузка сообщений и участников ───────────────────────
  useEffect(() => {
    if (!activeRoom) return;
    setMsgs([]); setLoading(true);

    Promise.all([
      api.messages(activeRoom.id),
      api.roomMembers(activeRoom.id).catch(() => []),
      (activeRoom.kind==='voice'||activeRoom.kind==='meeting')
        ? api.voiceState(activeRoom.id).catch(() => null)
        : Promise.resolve(null),
    ]).then(([rawMsgs, rawMembers, voice]) => {
      const msgArr = Array.isArray(rawMsgs) ? rawMsgs : rawMsgs?.messages||rawMsgs?.data||[];
      setMsgs(msgArr.map(normalizeMsg));

      const mArr = Array.isArray(rawMembers) ? rawMembers : rawMembers?.members||[];
      setMembers(mArr.map(m => normalizeUser(m.user||m)));

      if (voice) {
        const p = voice.participants||voice.users||[];
        setVoiceMap(v => ({ ...v, [activeRoom.id]: p }));
      }

      setUnread(u => ({ ...u, [activeRoom.id]: 0 }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeRoom?.id]);

  // ── скролл вниз при новых сообщениях ──────────────────────
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  // ── WebSocket ──────────────────────────────────────────────
  useEffect(() => {
    wsClose.current?.();
    wsClose.current = connectWS(token, {
      onMessage: msg => {
        if (msg.type==='message_created') {
          const norm = normalizeMsg(msg.message||msg.data||msg);
          if (msg.roomId===activeRoom?.id || norm.roomId===activeRoom?.id) {
            setMsgs(m => [...m, norm]);
          } else {
            setUnread(u => ({ ...u, [msg.roomId||norm.roomId]: (u[msg.roomId]||0)+1 }));
          }
        }
        if (msg.type==='voice_updated'||msg.type==='voice_state') {
          setVoiceMap(v => ({ ...v, [msg.roomId]: msg.participants||msg.state?.participants||[] }));
        }
        if (msg.type==='user_joined'||msg.type==='presence') {
          // Обновляем participants
        }
      },
    });
    return () => wsClose.current?.();
  }, [token, activeRoom?.id]);

  // ── polling voice state каждые 8с ─────────────────────────
  useEffect(() => {
    const voiceRooms = rooms.filter(r=>r.kind==='voice'||r.kind==='meeting');
    if (!voiceRooms.length) return;
    const tick = () => {
      voiceRooms.forEach(r => {
        api.voiceState(r.id).then(s => {
          if (s) setVoiceMap(v => ({ ...v, [r.id]: s.participants||[] }));
        }).catch(()=>{});
      });
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, [rooms.length]);

  // ── отправка сообщения ─────────────────────────────────────
  async function sendMsg() {
    const text = input.trim(); if (!text || !activeRoom) return;
    setInput('');
    inputRef.current.style.height = 'auto';

    if (text.toLowerCase().startsWith('@ai')) {
      const q = text.slice(3).trim();
      if (rightPanel!=='ai') setRight('ai');
      handleAI(q); return;
    }

    const temp = normalizeMsg({ id:'tmp_'+Date.now(), content:text, userId:user?.id, displayName:user?.displayName, username:user?.username, userRole:user?.role, createdAt:new Date().toISOString() });
    setMsgs(m => [...m, temp]);
    try { await api.sendMsg(activeRoom.id, text); }
    catch { toast$('Ошибка отправки','error'); setMsgs(m => m.filter(x=>x.id!==temp.id)); }
  }

  // ── AI ─────────────────────────────────────────────────────
  async function handleAI(q) {
    if (!activeRoom) { toast$('Выберите комнату'); return; }
    const cmd = q.toLowerCase();
    setAiMsgs(m => [...m, { role:'user', text:q }]);
    setAiLoad(true);

    try {
      let reply;
      if (cmd==='суммаризировать'||cmd==='summarize') {
        const d = await api.aiSummarize(activeRoom.id);
        reply = '📋 Суммаризация:\n\n' + (d.summary||'Нет данных');
      } else if (cmd==='черновик'||cmd==='draft') {
        const ctx = msgs.slice(-3).map(m=>m.content).join('\n');
        const d = await api.aiDraft(activeRoom.id, ctx);
        reply = '✍️ Черновик:\n\n' + (d.draft||d.text||'');
        // вставляем в composer
        setInput(d.draft||d.text||'');
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (cmd==='очистить'||cmd==='clear') {
        setAiMsgs([{ role:'assistant', text:'История очищена.' }]);
        setAiLoad(false); return;
      } else {
        const d = await api.aiAsk(activeRoom.id, q);
        reply = d.reply||d.text||d.answer||'Нет ответа';
      }
      setAiMsgs(m => [...m, { role:'assistant', text:reply }]);
    } catch (e) {
      setAiMsgs(m => [...m, { role:'assistant', text:'❌ Ошибка: ' + e.message }]);
    }
    setAiLoad(false);
  }

  // ── голос ──────────────────────────────────────────────────
  async function joinVoice() {
    if (!activeRoom) return;
    try {
      await api.voiceJoin(activeRoom.id);
      const s = await api.voiceState(activeRoom.id);
      setVoiceMap(v => ({ ...v, [activeRoom.id]: s?.participants||[] }));
      setInVoice(true); setOverlay(true);
      toast$('Вы в голосовом контуре','success');
    } catch (e) { toast$(e.message, 'error'); }
  }

  async function leaveVoice() {
    if (!activeRoom) return;
    try { await api.voiceLeave(activeRoom.id); } catch {}
    setInVoice(false); setOverlay(false);
    toast$('Вы покинули голосовой контур');
  }

  // ── сортировка участников ──────────────────────────────────
  const voiceNow = voiceMap[activeRoom?.id] || [];
  const onlineMembers  = members.filter(m => m.id !== user?.id);
  const totalOnline    = 1 + onlineMembers.filter(m => m.status!=='offline').length;

  // ── группировка сообщений ──────────────────────────────────
  const grouped = msgs.reduce((acc, msg, i) => {
    const prev = msgs[i-1];
    const samePerson = prev && prev.userId===msg.userId && (new Date(msg.createdAt)-new Date(prev.createdAt)) < 300000;
    const sameDay = prev && fmtDate(prev.createdAt)===fmtDate(msg.createdAt);
    return [...acc, { ...msg, cont: samePerson, newDate: !prev || !sameDay }];
  }, []);

  const textRooms    = rooms.filter(r => r.kind==='group'||r.kind==='dm'||r.kind==='text');
  const voiceRooms   = rooms.filter(r => r.kind==='voice');
  const meetingRooms = rooms.filter(r => r.kind==='meeting');

  const filteredMsgs = search
    ? grouped.filter(m => m.content.toLowerCase().includes(search.toLowerCase()))
    : grouped;

  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ display:'flex', height:'100vh', background:'#0e0f11', fontFamily:'system-ui,-apple-system,sans-serif', color:'#dcddde', overflow:'hidden' }}>

      {/* ── RAIL ── */}
      <div style={{ width:60, background:'#0e0f11', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:6, borderRight:'1px solid rgba(255,255,255,.04)', flexShrink:0, zIndex:10 }}>
        <RailBtn icon="С" title="Сигнум" accent="#5865f2" rounded={false} />
        <div style={{ width:32, height:1, background:'rgba(255,255,255,.08)', margin:'2px 0' }}/>
        <RailBtn icon="💬" title="Чат" active />
        <RailBtn icon="📋" title="Задачи" onClick={() => toast$('Задачи — в разработке')} />
        <RailBtn icon="📊" title="Статистика" onClick={() => toast$('Статистика')} />
        <div style={{ marginTop:'auto' }}>
          <RailBtn icon="⚙" title="Настройки" onClick={() => toast$('Настройки')} />
          <div style={{ marginTop:6 }}>
            <Tooltip text={`${user?.displayName} · Выйти`}>
              <div onClick={onLogout} style={{ width:36, height:36, borderRadius:'50%', background:uidColor(user?.id), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', margin:'0 auto' }}>
                {initials(user?.displayName||'?')}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{ width:220, background:'#111214', display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,.04)', flexShrink:0 }}>
        {/* Org header */}
        <div style={{ height:48, display:'flex', alignItems:'center', padding:'0 14px', borderBottom:'1px solid rgba(255,255,255,.04)', cursor:'pointer', gap:8 }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <span style={{ fontSize:14, fontWeight:700, color:'#f2f3f5', flex:1 }}>Контур Связи</span>
          <span style={{ color:'#80848e', fontSize:16 }}>⌄</span>
        </div>

        {/* Search */}
        <div onClick={() => setSearchOpen(true)} style={{ margin:'6px 8px', padding:'6px 10px', background:'#0e0f11', borderRadius:6, display:'flex', alignItems:'center', gap:6, cursor:'text', border:'1px solid rgba(255,255,255,.04)', transition:'border-color .15s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.1)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.04)'}>
          <span style={{ fontSize:13, color:'#6d6f78' }}>🔍</span>
          <span style={{ fontSize:12, color:'#6d6f78' }}>Поиск</span>
          <span style={{ marginLeft:'auto', fontSize:10, color:'#4e5058', fontFamily:'monospace' }}>⌘K</span>
        </div>

        {/* Rooms list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {textRooms.length>0 && (<>
            <SbSection label="Текстовые" onAdd={() => toast$('Создать комнату')} />
            {textRooms.map(r => (
              <SbRoom key={r.id} room={r} active={activeRoom?.id===r.id} icon="#" unread={unread[r.id]||0}
                onClick={() => setActive(r)} />
            ))}
          </>)}

          {voiceRooms.length>0 && (<>
            <SbSection label="Голосовые" onAdd={() => toast$('Создать голосовую')} />
            {voiceRooms.map(r => (
              <div key={r.id}>
                <SbRoom room={r} active={activeRoom?.id===r.id} icon="🎙"
                  badge={(voiceMap[r.id]||[]).length > 0 ? `🎙 ${(voiceMap[r.id]||[]).length}` : null}
                  onClick={() => setActive(r)} />
                {(voiceMap[r.id]||[]).map(p => (
                  <div key={p.userId||p.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 8px 2px 32px', borderRadius:5, margin:'1px 4px', cursor:'pointer', color:'#80848e', fontSize:12 }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{ position:'relative' }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background:uidColor(p.userId||p.id), display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff' }}>
                        {initials(p.displayName||p.username||'?')}
                      </div>
                    </div>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.displayName||p.username}</span>
                    <span style={{ fontSize:11, opacity: p.isMuted?0.3:0.7 }}>{p.isMuted?'🔇':'🎤'}</span>
                  </div>
                ))}
              </div>
            ))}
          </>)}

          {meetingRooms.length>0 && (<>
            <SbSection label="Собрания" onAdd={() => toast$('Создать собрание')} />
            {meetingRooms.map(r => (
              <SbRoom key={r.id} room={r} active={activeRoom?.id===r.id} icon="📋"
                onClick={() => setActive(r)} />
            ))}
          </>)}
        </div>

        {/* Footer */}
        <div style={{ padding:'8px 8px', borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Av user={user} size={30} />
            <StatusDot status="online" border="#111214" />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#f2f3f5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.displayName||user?.username}</div>
            <div style={{ fontSize:10, color:'#6d6f78' }}>{user?.role||'Пользователь'}</div>
          </div>
          <div style={{ display:'flex', gap:1 }}>
            <IBtn icon={micOn?'🎤':'🔇'} title={micOn?'Выкл. микрофон':'Вкл. микрофон'} active={!micOn} onClick={() => setMic(v=>!v)} />
            <IBtn icon="⚙" title="Настройки" onClick={() => toast$('Настройки')} />
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Header */}
        <div style={{ height:48, background:'#1c1d20', display:'flex', alignItems:'center', padding:'0 16px', gap:10, borderBottom:'1px solid rgba(255,255,255,.04)', flexShrink:0 }}>
          <span style={{ fontSize:16, color:'#80848e', flexShrink:0 }}>
            {activeRoom?.kind==='voice'?'🎙':activeRoom?.kind==='meeting'?'📋':'#'}
          </span>
          <span style={{ fontSize:14, fontWeight:700, color:'#f2f3f5' }}>{activeRoom?.name||'Выберите комнату'}</span>
          {activeRoom?.description && (<>
            <div style={{ width:1, height:18, background:'rgba(255,255,255,.06)' }}/>
            <span style={{ fontSize:12, color:'#6d6f78', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{activeRoom.description}</span>
          </>)}

          <div style={{ marginLeft:'auto', display:'flex', gap:2, alignItems:'center' }}>
            {(activeRoom?.kind==='voice'||activeRoom?.kind==='meeting') && (
              <IBtn icon={inVoice?'📴':'📞'} title={inVoice?'Покинуть':'Подключиться'} active={inVoice} onClick={inVoice?leaveVoice:joinVoice} />
            )}
            <IBtn icon="🔍" title="Поиск" active={searchOpen} onClick={() => setSearchOpen(v=>!v)} />
            <IBtn icon="📌" title="Закреплённые" onClick={() => { const pinned=msgs.filter(m=>m.isPinned); toast$(pinned.length?`${pinned.length} закреплённых`:'Нет закреплённых'); }} />
            <IBtn icon="👥" title="Участники" active={rightPanel==='members'} onClick={() => setRight(p=>p==='members'?'none':'members')} />
            <IBtn icon="🤖" title="AI-ассистент" active={rightPanel==='ai'} onClick={() => setRight(p=>p==='ai'?'none':'ai')} />
            <IBtn icon="📺" title={overlay?'Скрыть overlay':'Показать overlay'} active={overlay} onClick={() => setOverlay(v=>!v)} />
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div style={{ padding:'8px 16px', background:'#1c1d20', borderBottom:'1px solid rgba(255,255,255,.04)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:14, color:'#80848e' }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по сообщениям..."
              autoFocus
              style={{ flex:1, background:'transparent', border:'none', color:'#f2f3f5', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
            <button onClick={() => { setSearch(''); setSearchOpen(false); }} style={{ background:'none', border:'none', color:'#80848e', cursor:'pointer', fontSize:12 }}>✕ Закрыть</button>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', background:'#1c1d20', paddingBottom:8 }}>
          {loading && (
            <div style={{ display:'flex', justifyContent:'center', padding:32 }}>
              <div style={{ width:24, height:24, border:'3px solid rgba(255,255,255,.08)', borderTop:'3px solid #5865f2', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
            </div>
          )}
          {!activeRoom && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'#6d6f78' }}>
              <div style={{ fontSize:52 }}>💬</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#f2f3f5' }}>Выберите комнату</div>
              <div style={{ fontSize:13 }}>Выберите канал в левой панели</div>
            </div>
          )}
          {activeRoom && !loading && msgs.length===0 && (
            <div style={{ padding:'32px 16px' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>{activeRoom.kind==='voice'?'🎙':activeRoom.kind==='meeting'?'📋':'#'}</div>
              <div style={{ fontSize:20, fontWeight:700, color:'#f2f3f5', marginBottom:4 }}>Добро пожаловать в #{activeRoom.name}</div>
              <div style={{ fontSize:14, color:'#6d6f78' }}>Это начало канала. Напишите первое сообщение!</div>
            </div>
          )}
          {filteredMsgs.map((msg, i) => (
            <MsgItem key={msg.id||i} msg={msg} me={user?.id}
              onDelete={async () => { try { await api.deleteMsg(activeRoom.id, msg.id); setMsgs(m=>m.filter(x=>x.id!==msg.id)); toast$('Сообщение удалено'); } catch { toast$('Ошибка','error'); } }}
              onPin={async () => { try { await api.pinMsg(activeRoom.id, msg.id); toast$('Сообщение закреплено'); } catch { toast$('Ошибка','error'); } }}
              onReply={() => { setInput(`↩ ${msg.user?.displayName||'Пользователь'}: ${msg.content.slice(0,40)}...\n`); inputRef.current?.focus(); }}
            />
          ))}
          {search && filteredMsgs.length===0 && (
            <div style={{ textAlign:'center', padding:32, color:'#6d6f78', fontSize:13 }}>По запросу «{search}» ничего не найдено</div>
          )}
          <div ref={msgEnd}/>
        </div>

        {/* Composer */}
        {activeRoom && (
          <div style={{ padding:'0 16px 14px', background:'#1c1d20', flexShrink:0 }}>
            <div style={{ background:'#2b2d31', borderRadius:10, display:'flex', alignItems:'flex-end', gap:8, padding:'10px 12px', border:'1px solid rgba(255,255,255,.06)' }}>
              <button onClick={() => toast$('Прикрепить файл')} style={{ background:'none', border:'none', color:'#80848e', fontSize:20, cursor:'pointer', padding:0, flexShrink:0 }}
                onMouseEnter={e=>e.currentTarget.style.color='#f2f3f5'} onMouseLeave={e=>e.currentTarget.style.color='#80848e'}>＋</button>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} }}
                placeholder={`Написать в #${activeRoom.name}... (или @ai вопрос)`}
                rows={1} style={{ flex:1, background:'transparent', border:'none', color:'#dcddde', fontSize:13, resize:'none', outline:'none', minHeight:20, maxHeight:160, lineHeight:1.55, fontFamily:'inherit' }}
                onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,160)+'px'; }}/>
              <div style={{ display:'flex', gap:4, alignItems:'center', flexShrink:0 }}>
                <button style={{ background:'none', border:'none', color:'#80848e', fontSize:16, cursor:'pointer' }} onClick={() => toast$('Emoji picker')}>😊</button>
                <button style={{ background:'none', border:'none', color:'#80848e', fontSize:16, cursor:'pointer' }} onClick={() => toast$('Прикрепить')}>📎</button>
                <button onClick={sendMsg} style={{ width:32, height:32, borderRadius:8, background:input.trim()?'#5865f2':'#2a2b30', border:'none', color:'#fff', cursor:input.trim()?'pointer':'default', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'background .15s', flexShrink:0 }}>➤</button>
              </div>
            </div>
            <div style={{ fontSize:11, color:'#4e5058', marginTop:4, paddingLeft:4 }}>
              Shift+Enter — новая строка · @ai вопрос — AI-ассистент · @ai суммаризировать — резюме
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: MEMBERS ── */}
      {rightPanel==='members' && (
        <div style={{ width:240, background:'#111214', borderLeft:'1px solid rgba(255,255,255,.04)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'12px 12px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6d6f78' }}>Участники</span>
            <span style={{ fontSize:10, background:'#2a2b30', borderRadius:999, padding:'1px 7px', color:'#b5bac1' }}>{members.length+1}</span>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'0 4px 8px' }}>
            {/* Текущий пользователь */}
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'#6d6f78', padding:'8px 8px 4px' }}>В сети — {totalOnline}</div>
            <MemberRow member={user} isMe voiceRooms={voiceRooms} voiceMap={voiceMap} onToast={toast$} />
            {onlineMembers.map(m => (
              <MemberRow key={m.id} member={m} voiceRooms={voiceRooms} voiceMap={voiceMap} onToast={toast$} />
            ))}
            {members.length === 0 && (
              <div style={{ padding:'8px 8px', fontSize:12, color:'#6d6f78', lineHeight:1.6 }}>
                Список участников загружается или пуст. Участники появятся по мере входа в комнату.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RIGHT PANEL: AI ── */}
      {rightPanel==='ai' && (
        <div style={{ width:280, background:'#111214', borderLeft:'1px solid rgba(255,255,255,.04)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'12px 12px 8px', borderBottom:'1px solid rgba(255,255,255,.04)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🤖</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#f2f3f5' }}>Сигнум AI</div>
              <div style={{ fontSize:10, color:'#6d6f78' }}>{activeRoom?.name||'Выберите комнату'}</div>
            </div>
            <button onClick={() => setRight('none')} style={{ background:'none', border:'none', color:'#6d6f78', cursor:'pointer', fontSize:14 }}>✕</button>
          </div>
          <div style={{ padding:8, display:'flex', gap:5, flexWrap:'wrap', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
            {[['📋 Суммаризировать','суммаризировать'],['✍️ Черновик','черновик'],['🗑 Очистить','очистить']].map(([label, cmd]) => (
              <button key={cmd} onClick={() => handleAI(cmd)} style={{ padding:'4px 8px', borderRadius:6, background:'rgba(88,101,242,.1)', border:'1px solid rgba(88,101,242,.2)', color:'#9aa8fc', fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(88,101,242,.2)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(88,101,242,.1)'}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:8 }}>
            {aiMsgs.map((m,i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:2, alignItems: m.role==='user'?'flex-end':'flex-start' }}>
                <span style={{ fontSize:10, color:'#4e5058', padding:'0 3px' }}>{m.role==='user'?'Вы':'Сигнум AI'}</span>
                <div style={{ maxWidth:'90%', padding:'7px 10px', borderRadius: m.role==='user'?'10px 10px 3px 10px':'10px 10px 10px 3px', background: m.role==='user'?'rgba(88,101,242,.18)':'rgba(255,255,255,.05)', fontSize:12, lineHeight:1.6, color:'#dcddde', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display:'flex', gap:4, padding:'8px 10px', background:'rgba(255,255,255,.05)', borderRadius:10, width:'fit-content' }}>
                {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#80848e', animation:`bounce .8s ${i*.15}s ease-in-out infinite` }}/>)}
              </div>
            )}
          </div>
          <div style={{ padding:8, borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', gap:6, alignItems:'flex-end' }}>
            <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleAI(aiInput);setAiInput('');} }}
              placeholder="Задать вопрос..." rows={1}
              style={{ flex:1, background:'rgba(0,0,0,.2)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'7px 9px', color:'#f2f3f5', fontSize:12, outline:'none', resize:'none', minHeight:30, maxHeight:80, fontFamily:'inherit' }}/>
            <button onClick={() => { if(aiInput.trim()){handleAI(aiInput);setAiInput('');} }} style={{ width:30, height:30, borderRadius:8, background:'#5865f2', border:'none', color:'#fff', cursor:'pointer', fontSize:13, flexShrink:0 }}>➤</button>
          </div>
        </div>
      )}

      {/* ── ACTIVITY PANEL (всегда видна, компактная) ── */}
      <div style={{ width:62, background:'#0e0f11', borderLeft:'1px solid rgba(255,255,255,.04)', display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0', gap:2, flexShrink:0 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#4e5058', marginBottom:4 }}>Онлайн</div>

        {/* Я */}
        <Tooltip text={`${user?.displayName||'Я'} (вы)`}>
          <div style={{ position:'relative', marginBottom:2 }}>
            <Av user={user} size={36} />
            <StatusDot status="online" border="#0e0f11" size={10} />
          </div>
        </Tooltip>

        {/* Другие участники */}
        {members.slice(0,12).map(m => (
          <Tooltip key={m.id} text={`${m.displayName} · ${voiceRooms.some(r=>(voiceMap[r.id]||[]).some(p=>(p.userId||p.id)===m.id))?'В голосе':'В сети'}`}>
            <div style={{ position:'relative', marginBottom:2 }}>
              <Av user={m} size={36} />
              <StatusDot status={voiceRooms.some(r=>(voiceMap[r.id]||[]).some(p=>(p.userId||p.id)===m.id))?'in_voice':'online'} border="#0e0f11" size={10} />
            </div>
          </Tooltip>
        ))}

        {members.length > 12 && (
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#2a2b30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'#80848e' }}>
            +{members.length-12}
          </div>
        )}

        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
          <div style={{ width:36, height:1, background:'rgba(255,255,255,.06)' }}/>
          <Tooltip text="Уведомления">
            <div onClick={() => toast$('Уведомления')} style={{ width:36, height:36, borderRadius:'50%', background:'#1a1b1e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#2a2b30';e.currentTarget.style.borderRadius='12px';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#1a1b1e';e.currentTarget.style.borderRadius='50%';}}>🔔</div>
          </Tooltip>
        </div>
      </div>

      {/* ── VOICE OVERLAY ── */}
      {overlay && <VoiceOverlay user={user} participants={voiceNow} micOn={micOn} deafOn={deafOn}
        onMic={()=>setMic(v=>!v)} onDeaf={()=>setDeaf(v=>!v)} onLeave={leaveVoice} onClose={()=>setOverlay(false)} />}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#18191c', color:'#dcddde', borderRadius:8, padding:'10px 18px', fontSize:13, fontWeight:500, borderLeft:`4px solid ${toast.type==='error'?'#ed4245':toast.type==='success'?'#23a55a':'#5865f2'}`, zIndex:9999, animation:'toastin .2s ease', whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,.4)', pointerEvents:'none' }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
        @keyframes toastin{from{transform:translateX(-50%) translateY(8px);opacity:0}to{transform:translateX(-50%);opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent}
      `}</style>
    </div>
  );
}

// ── Под-компоненты ────────────────────────────────────────────

function RailBtn({ icon, title, active, accent, rounded=true, onClick }) {
  const [h,setH]=useState(false);
  return (
    <Tooltip text={title}>
      <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{ width:44, height:44, borderRadius: h||active ? (rounded?'14px':'14px') : (rounded?'50%':'14px'), background: accent||((h||active)?'#5865f2':'#1e2030'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight: typeof icon==='string'&&icon.length<3?800:400, color:'#fff', cursor:'pointer', transition:'all .2s', userSelect:'none' }}>
        {icon}
      </div>
    </Tooltip>
  );
}

function SbSection({ label, onAdd }) {
  return (
    <div style={{ padding:'14px 8px 3px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6d6f78' }}>{label}</span>
      <button onClick={onAdd} style={{ background:'none', border:'none', color:'#6d6f78', fontSize:18, cursor:'pointer', lineHeight:1, padding:'0 2px' }}
        onMouseEnter={e=>e.currentTarget.style.color='#b5bac1'} onMouseLeave={e=>e.currentTarget.style.color='#6d6f78'}>＋</button>
    </div>
  );
}

function SbRoom({ room, active, icon, badge, unread, onClick }) {
  const [h,setH]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:6, cursor:'pointer', margin:'1px 4px', position:'relative',
        background: active?'rgba(255,255,255,.1)':h?'rgba(255,255,255,.05)':'transparent',
        color: active?'#f2f3f5':h?'#dcddde':unread?'#f2f3f5':'#80848e' }}>
      {active && <div style={{ position:'absolute', left:-4, top:'50%', transform:'translateY(-50%)', width:4, height:14, background:'#f2f3f5', borderRadius:'0 3px 3px 0' }}/>}
      <span style={{ fontSize:14, flexShrink:0, width:18, textAlign:'center' }}>{icon}</span>
      <span style={{ flex:1, fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{room.name}</span>
      {badge && <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:999, background:'rgba(88,101,242,.2)', color:'#9aa8fc' }}>{badge}</span>}
      {unread>0 && <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:999, background:'#ed4245', color:'#fff', minWidth:16, textAlign:'center' }}>{unread}</span>}
    </div>
  );
}

function MsgItem({ msg, me, onDelete, onPin, onReply }) {
  const [h,setH]=useState(false);
  const isMe = msg.userId===me;
  const name = msg.user?.displayName || msg.user?.username || 'Пользователь';
  return (
    <>
      {msg.newDate && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px 6px', fontSize:11, fontWeight:600, color:'#6d6f78' }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,.04)' }}/>{fmtDate(msg.createdAt)}<div style={{ flex:1, height:1, background:'rgba(255,255,255,.04)' }}/>
        </div>
      )}
      <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{ padding: msg.cont?'1px 16px':'4px 16px', position:'relative', background: h?'rgba(255,255,255,.02)':'transparent' }}>
        {msg.isPinned && <div style={{ fontSize:11, color:'#f0a500', padding:'0 0 3px 52px', display:'flex', alignItems:'center', gap:4 }}><span>📌</span> Закреплённое сообщение</div>}
        {!msg.cont ? (
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ position:'relative', flexShrink:0, marginTop:2 }}>
              <Av user={msg.user} size={38} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:13, fontWeight:600, color: uidColor(msg.userId) }}>{name}</span>
                {msg.user?.role && <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:3, background:'rgba(88,101,242,.2)', color:'#9aa8fc' }}>{msg.user.role}</span>}
                <span style={{ fontSize:11, color:'#6d6f78' }}>{fmtTime(msg.createdAt)}</span>
                {msg.editedAt && <span style={{ fontSize:10, color:'#6d6f78' }}>(изм.)</span>}
              </div>
              <div style={{ fontSize:13, color:'#dcddde', lineHeight:1.6, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>{msg.content}</div>
            </div>
          </div>
        ) : (
          <div style={{ paddingLeft:50, fontSize:13, color:'#dcddde', lineHeight:1.6, wordBreak:'break-word', whiteSpace:'pre-wrap', position:'relative' }}>
            {h && <span style={{ position:'absolute', left:0, top:1, fontSize:11, color:'#4e5058', userSelect:'none', width:44, textAlign:'right' }}>{fmtTime(msg.createdAt)}</span>}
            {msg.content}
          </div>
        )}
        {h && (
          <div style={{ position:'absolute', top:-12, right:16, background:'#2b2d31', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:3, display:'flex', gap:1, zIndex:5, boxShadow:'0 4px 12px rgba(0,0,0,.4)' }}>
            {[['↩','Ответить',onReply],['😊','Реакция',()=>{}],['📌','Закрепить',onPin],...(isMe?[['✏','Редактировать',()=>{}],['🗑','Удалить',onDelete]]:[])].map(([ic,t,fn])=>(
              <button key={t} title={t} onClick={fn}
                style={{ width:28, height:28, borderRadius:6, border:'none', background:'transparent', color:'#b5bac1', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}
                onMouseEnter={e=>{e.currentTarget.style.background=ic==='🗑'?'rgba(237,66,69,.15)':'rgba(255,255,255,.08)';if(ic==='🗑')e.currentTarget.style.color='#ed4245';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#b5bac1';}}>
                {ic}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MemberRow({ member, isMe, voiceRooms, voiceMap, onToast }) {
  const [h,setH]=useState(false);
  if (!member) return null;
  const inVoice = voiceRooms?.some(r=>(voiceMap[r.id]||[]).some(p=>(p.userId||p.id)===member.id));
  const status = inVoice ? 'in_voice' : 'online';
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:6, cursor:'pointer', background:h?'rgba(255,255,255,.05)':'transparent', position:'relative' }}>
      <div style={{ position:'relative' }}>
        <Av user={member} size={30} />
        <StatusDot status={status} border="#111214" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:500, color:'#dcddde', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
          {member.displayName||member.username}
          {isMe && <span style={{ fontSize:9, color:'#5865f2', fontWeight:600 }}>(вы)</span>}
        </div>
        <div style={{ fontSize:10, color:'#6d6f78', display:'flex', alignItems:'center', gap:3, marginTop:1 }}>
          {inVoice ? <span style={{ color:'#9aa8fc' }}>🎙 В голосе</span> : <span>В сети</span>}
        </div>
      </div>
      {h && !isMe && (
        <div style={{ display:'flex', gap:1 }}>
          {[['📣','Вызвать'],['💬','Написать'],['👤','Профиль']].map(([ic,t])=>(
            <button key={t} title={t} onClick={()=>onToast(t)} style={{ width:22, height:22, borderRadius:4, border:'none', background:'transparent', color:'#6d6f78', cursor:'pointer', fontSize:12 }}>{ic}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceOverlay({ user, participants, micOn, deafOn, onMic, onDeaf, onLeave, onClose }) {
  const [pos,setPos] = useState({ top:14, right:14 });
  const [drag,setDrag] = useState(false);
  const ref = useRef(null);
  const startRef = useRef(null);

  useEffect(()=>{
    const move=e=>{ if(!drag||!startRef.current)return; setPos({ top:e.clientY-startRef.current.y, left:e.clientX-startRef.current.x, right:'auto' }); };
    const up=()=>setDrag(false);
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    return ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
  },[drag]);

  return (
    <div ref={ref} style={{ position:'fixed', ...pos, width:210, background:'rgba(10,11,13,.95)', backdropFilter:'blur(16px)', borderRadius:12, border:'1px solid rgba(255,255,255,.1)', overflow:'hidden', zIndex:1000, boxShadow:'0 8px 32px rgba(0,0,0,.6)' }}>
      <div onMouseDown={e=>{setDrag(true);const b=ref.current.getBoundingClientRect();startRef.current={x:e.clientX-b.left,y:e.clientY-b.top};}}
        style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,.06)', cursor:'move', userSelect:'none' }}>
        <div style={{ width:24, height:24, borderRadius:7, background:'#5865f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>С</div>
        <span style={{ flex:1, fontSize:11, fontWeight:600, color:'#b5bac1' }}>В эфире · Сигнум</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#6d6f78', cursor:'pointer', fontSize:13 }}>✕</button>
      </div>
      <div style={{ margin:'0 10px 7px', padding:'4px 8px', background:'rgba(35,165,90,.07)', border:'1px solid rgba(35,165,90,.15)', borderRadius:6, display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#57c78a' }}>
        <div style={{ width:5, height:5, borderRadius:'50%', background:'#23a55a' }}/> ЭЦП верифицирована
      </div>
      <div style={{ padding:'6px 10px 4px' }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#4e5058', marginBottom:4 }}>Голосовой контур</div>
        <div style={{ fontSize:11, fontWeight:600, color:'#dbdee1', display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#23a55a', animation:'pulse 2s ease-in-out infinite' }}/>
          Активный · {participants.length} уч.
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:1, padding:'0 6px 6px' }}>
        {participants.length === 0
          ? <div style={{ padding:'4px 8px', fontSize:11, color:'#4e5058', textAlign:'center' }}>Войдите в голосовой контур</div>
          : participants.map(p => (
            <div key={p.userId||p.id} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px', borderRadius:6, cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <Av user={{ id:p.userId||p.id, displayName:p.displayName||p.username }} size={24} ring={!p.isMuted} />
              <span style={{ flex:1, fontSize:11, fontWeight:500, color:'#dbdee1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.displayName||p.username}</span>
              <span style={{ fontSize:11, opacity:p.isMuted?.3:.8 }}>{p.isMuted?'🔇':'🎤'}</span>
            </div>
          ))
        }
      </div>
      <div style={{ height:1, background:'rgba(255,255,255,.05)', margin:'2px 10px' }}/>
      <div style={{ padding:'7px 10px', display:'flex', gap:5 }}>
        {[
          [micOn?'🎤 Мик':'🔇 Мик', micOn, false, onMic],
          [deafOn?'🔇 Звук':'🔈 Звук', !deafOn, false, onDeaf],
          ['☎', false, true, onLeave],
        ].map(([label, active, danger, fn]) => (
          <button key={label} onClick={fn} style={{ flex:1, padding:'5px 3px', borderRadius:6, border:'none', background:active?'rgba(88,101,242,.2)':'rgba(255,255,255,.06)', color:active?'#9aa8fc':'#b5bac1', fontSize:11, fontWeight:500, cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e=>{ if(danger){e.currentTarget.style.background='rgba(237,66,69,.2)';e.currentTarget.style.color='#ed4245';}else e.currentTarget.style.background='rgba(255,255,255,.1)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=active?'rgba(88,101,242,.2)':'rgba(255,255,255,.06)'; e.currentTarget.style.color=active?'#9aa8fc':'#b5bac1'; }}>
            {label}
          </button>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
