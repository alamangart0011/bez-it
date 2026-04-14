import React, { useMemo, useState } from 'react';
import { buildRoomBasedPreviewModel, ROOM_BASED_ROLE_PRESETS } from './buildRoomBasedPreviewModel.js';

const css = `
:root{
  --bg:#0b1220;
  --panel:#121c2f;
  --panel-2:#17233a;
  --line:#24324d;
  --txt:#e7edf8;
  --muted:#9fb0cc;
  --soft:#7f93b7;
  --acc:#2563eb;
  --acc-2:#1d4ed8;
  --ok:#22c55e;
  --warn:#f59e0b;
  --danger:#ef4444;
  --voice:#0f7b6c;
  --meeting:#6d28d9;
  --shadow:0 18px 60px rgba(0,0,0,.35);
  --radius:16px;
}
*{box-sizing:border-box}
.sg-html-ref{margin:0;font-family:Inter,Arial,Helvetica,sans-serif;background:linear-gradient(180deg,#08101d 0%,#0b1220 100%);color:var(--txt)}
.sg-html-ref .app{display:grid;grid-template-columns:280px 1fr 340px;min-height:100vh}
.sg-html-ref .sidebar,.sg-html-ref .context{background:rgba(14,22,37,.86);backdrop-filter:blur(14px);border-right:1px solid var(--line)}
.sg-html-ref .context{border-right:none;border-left:1px solid var(--line)}
.sg-html-ref .main{display:flex;flex-direction:column;min-width:0}
.sg-html-ref .brand{padding:22px 20px 14px;border-bottom:1px solid var(--line)}
.sg-html-ref .brand-row{display:flex;align-items:center;gap:12px}
.sg-html-ref .logo{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,var(--acc),#38bdf8);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;color:#fff;box-shadow:var(--shadow)}
.sg-html-ref .brand h1{margin:0;font-size:16px}
.sg-html-ref .brand p{margin:4px 0 0;color:var(--muted);font-size:12px}
.sg-html-ref .side-section{padding:18px 16px;border-bottom:1px solid var(--line)}
.sg-html-ref .section-title{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin:0 0 12px}
.sg-html-ref .search{width:100%;border:1px solid var(--line);background:#0d1728;color:var(--txt);padding:11px 12px;border-radius:12px;outline:none}
.sg-html-ref .room-list,.sg-html-ref .nav-list,.sg-html-ref .quick-list{display:flex;flex-direction:column;gap:8px}
.sg-html-ref .item{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:12px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;transition:.18s}
.sg-html-ref .item:hover,.sg-html-ref .item.active{background:var(--panel-2);border-color:#355087}
.sg-html-ref .item-left{display:flex;align-items:center;gap:10px;min-width:0}
.sg-html-ref .kind{width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700}
.sg-html-ref .kind.group{background:#173157;color:#93c5fd}
.sg-html-ref .kind.voice{background:#10382f;color:#5eead4}
.sg-html-ref .kind.meeting{background:#2a1d54;color:#c4b5fd}
.sg-html-ref .meta{min-width:0}
.sg-html-ref .meta strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sg-html-ref .meta span{display:block;font-size:11px;color:var(--muted);margin-top:2px}
.sg-html-ref .pill{padding:5px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#1b2a45;color:#b8c7e1;white-space:nowrap}
.sg-html-ref .pill.green{background:#123223;color:#86efac}
.sg-html-ref .pill.amber{background:#3a250a;color:#fdba74}
.sg-html-ref .pill.red{background:#3d1111;color:#fca5a5}
.sg-html-ref .side-profile{padding:18px 16px;margin-top:auto}
.sg-html-ref .profile-card{border:1px solid var(--line);background:var(--panel);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px}
.sg-html-ref .profile-top{display:flex;align-items:center;gap:12px}
.sg-html-ref .avatar{width:42px;height:42px;border-radius:14px;background:#243b66;display:flex;align-items:center;justify-content:center;font-weight:800}
.sg-html-ref .role-switch{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sg-html-ref .role-btn{border:1px solid var(--line);background:#0f1728;color:var(--muted);padding:9px 10px;border-radius:10px;cursor:pointer;font-size:12px}
.sg-html-ref .role-btn.active{background:#1b2e56;color:#fff;border-color:#3d61a8}
.sg-html-ref .topbar{height:72px;display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--line);background:rgba(10,17,30,.78);backdrop-filter:blur(12px);position:sticky;top:0;z-index:2}
.sg-html-ref .topbar h2{margin:0;font-size:20px}
.sg-html-ref .topbar p{margin:6px 0 0;color:var(--muted);font-size:13px}
.sg-html-ref .top-actions{display:flex;gap:10px;align-items:center}
.sg-html-ref .btn{border:none;background:var(--acc);color:#fff;padding:11px 14px;border-radius:12px;font-weight:700;cursor:pointer}
.sg-html-ref .btn.secondary{background:#17253c;color:#dbe7ff;border:1px solid var(--line)}
.sg-html-ref .btn.ghost{background:transparent;border:1px solid var(--line);color:var(--txt)}
.sg-html-ref .workspace{padding:24px;display:flex;flex-direction:column;gap:18px}
.sg-html-ref .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.sg-html-ref .card{background:linear-gradient(180deg,rgba(18,28,47,.98),rgba(15,22,36,.98));border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:var(--shadow)}
.sg-html-ref .card h3{margin:0 0 10px;font-size:14px}
.sg-html-ref .muted{color:var(--muted)}
.sg-html-ref .big{font-size:30px;font-weight:800;margin-top:6px}
.sg-html-ref .row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.sg-html-ref .grid-2{display:grid;grid-template-columns:1.25fr .95fr;gap:18px}
.sg-html-ref .feed{display:flex;flex-direction:column;gap:12px}
.sg-html-ref .message{display:flex;gap:12px;padding:12px;border:1px solid var(--line);background:#111b2c;border-radius:14px}
.sg-html-ref .message .avatar{width:36px;height:36px;border-radius:12px;font-size:13px}
.sg-html-ref .message .body{min-width:0}
.sg-html-ref .message .body strong{display:block;font-size:13px}
.sg-html-ref .message .body span{display:block;color:var(--muted);font-size:11px;margin-top:3px}
.sg-html-ref .composer{display:flex;gap:10px;margin-top:6px}
.sg-html-ref .composer input{flex:1;background:#0c1525;border:1px solid var(--line);color:#fff;border-radius:14px;padding:13px 14px}
.sg-html-ref .participants,.sg-html-ref .mini-list{display:flex;flex-direction:column;gap:10px}
.sg-html-ref .participant{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border-radius:14px;background:#10192b;border:1px solid var(--line)}
.sg-html-ref .participant .left{display:flex;align-items:center;gap:10px;min-width:0}
.sg-html-ref .indicator{width:9px;height:9px;border-radius:999px;background:#3b4b6c}
.sg-html-ref .indicator.live{background:var(--ok);box-shadow:0 0 0 6px rgba(34,197,94,.12)}
.sg-html-ref .indicator.voice{background:#2dd4bf;box-shadow:0 0 0 6px rgba(45,212,191,.12)}
.sg-html-ref .tabs{display:flex;gap:10px;flex-wrap:wrap}
.sg-html-ref .tab{padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:#121d31;color:var(--muted);cursor:pointer}
.sg-html-ref .tab.active{background:#1c2d52;color:#fff;border-color:#36579a}
.sg-html-ref .timeline{display:flex;flex-direction:column;gap:10px}
.sg-html-ref .timeline-item{padding:12px;border-left:3px solid #36579a;background:#101a2b;border-radius:0 12px 12px 0}
.sg-html-ref .view{display:none}
.sg-html-ref .view.active{display:block}
.sg-html-ref .context{padding:20px 18px;display:flex;flex-direction:column;gap:18px}
.sg-html-ref .context h3{margin:0;font-size:15px}
.sg-html-ref .context-box{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:15px}
.sg-html-ref .metric-line{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.sg-html-ref .metric-line:last-child{border-bottom:none}
.sg-html-ref .admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.sg-html-ref .admin-panel{background:#101a2d;border:1px solid var(--line);border-radius:16px;padding:14px}
.sg-html-ref .hint{font-size:12px;color:var(--muted)}
.sg-html-ref .hero{padding:18px;border-radius:18px;background:linear-gradient(135deg,rgba(37,99,235,.22),rgba(59,130,246,.06));border:1px solid rgba(59,130,246,.28)}
.sg-html-ref .hero h3{margin:0 0 8px;font-size:18px}
.sg-html-ref .hero p{margin:0;color:#c9d8f3;max-width:820px;line-height:1.5}
.sg-html-ref .mobile-note{display:none;margin-top:8px;color:var(--soft);font-size:12px}
@media (max-width: 1380px){.sg-html-ref .app{grid-template-columns:260px 1fr 320px}.sg-html-ref .cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width: 1080px){.sg-html-ref .app{grid-template-columns:260px 1fr}.sg-html-ref .context{display:none}.sg-html-ref .grid-2{grid-template-columns:1fr}.sg-html-ref .admin-grid{grid-template-columns:1fr}.sg-html-ref .mobile-note{display:block}}
@media (max-width: 760px){.sg-html-ref .app{grid-template-columns:1fr}.sg-html-ref .sidebar{display:none}.sg-html-ref .topbar{padding:16px}.sg-html-ref .workspace{padding:16px}.sg-html-ref .cards{grid-template-columns:1fr}.sg-html-ref .top-actions{display:none}}
`;

export default function SignalumRoomBasedPreviewHtmlReference(props) {
  const [view, setView] = useState('dashboard');
  const [meetingTab, setMeetingTab] = useState('participants');
  const [roleView, setRoleView] = useState(props.roleView || 'admin');
  const model = useMemo(() => buildRoomBasedPreviewModel({
    roleView,
    user: props.user,
    rooms: props.rooms,
    currentRoomId: props.currentRoomId,
    messages: props.messages,
    members: props.members,
    participants: props.participants,
    incidentsCount: props.incidentsCount,
    pendingRequests: props.pendingRequests,
    nextMeetingTime: props.nextMeetingTime,
  }), [roleView, props.user, props.rooms, props.currentRoomId, props.messages, props.members, props.participants, props.incidentsCount, props.pendingRequests, props.nextMeetingTime]);

  const role = ROOM_BASED_ROLE_PRESETS[roleView] || ROOM_BASED_ROLE_PRESETS.admin;
  const viewMeta = {
    dashboard: {title:'Главная', subtitle:'Диспетчерская рабочего дня и полезная информация сразу после входа'},
    room: {title:'Общий контур', subtitle:'Текстовая комната без визуального мусора и с рабочим контекстом'},
    voice: {title:'Голосовой контур', subtitle:'Compact voice layout: participants first, dangerous actions на втором уровне'},
    meeting: {title:'Зал собраний', subtitle:'Meeting как сценарный режим: участники, повестка, материалы, журнал, итог'},
    admin: {title:'Админ-центр', subtitle:'Единый операционный центр без длинных форм и без полного падения экрана'}
  };

  return (
    <div className="sg-html-ref">
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-row">
              <div className="logo">S</div>
              <div>
                <h1>Signalum</h1>
                <p>Room-based V17 · единый рабочий контур</p>
              </div>
            </div>
          </div>
          <div className="side-section">
            <div className="section-title">Поиск</div>
            <input className="search" placeholder="Комнаты, люди, команды" readOnly />
          </div>
          <div className="side-section">
            <div className="section-title">Навигация</div>
            <div className="nav-list">
              {model.navRooms.map((item) => (
                <div key={item.key} className={`item ${view === item.key ? 'active' : ''}`} onClick={() => setView(item.key)}>
                  <div className="item-left"><div className={`kind ${item.kind}`}>{item.icon}</div><div className="meta"><strong>{item.label}</strong><span>{item.subtitle}</span></div></div>
                  {item.key === 'room' ? <span className="pill green">{model.roomMembers.length} онлайн</span> : null}
                  {item.key === 'voice' ? <span className="pill amber">{model.dashboard.voiceNow} в голосе</span> : null}
                  {item.key === 'meeting' ? <span className="pill">{model.meeting.nextMeetingTime}</span> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="side-section">
            <div className="section-title">Быстрые блоки</div>
            <div className="quick-list">
              <div className="item"><div className="item-left"><div className="kind voice">↗</div><div className="meta"><strong>Заявки на вход</strong><span>{model.dashboard.pendingRequests} ожидают решения</span></div></div></div>
              <div className="item"><div className="item-left"><div className="kind meeting">!</div><div className="meta"><strong>Инциденты</strong><span>{model.dashboard.incidentsCount} открыт · 3 в работе</span></div></div></div>
            </div>
          </div>
          <div className="side-profile">
            <div className="profile-card">
              <div className="profile-top"><div className="avatar">{role.avatar}</div><div><strong>{role.name}</strong><div className="hint">{role.role}</div></div></div>
              <div>
                <div className="section-title" style={{marginBottom:8}}>Роль просмотра</div>
                <div className="role-switch">
                  {Object.entries(ROOM_BASED_ROLE_PRESETS).map(([key, value]) => <button key={key} className={`role-btn ${roleView === key ? 'active' : ''}`} onClick={() => setRoleView(key)}>{value.name}</button>)}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main">
          <header className="topbar"><div><h2>{viewMeta[view].title}</h2><p>{viewMeta[view].subtitle}</p></div><div className="top-actions"><button className="btn secondary">Команды</button><button className="btn ghost">Приглашения</button><button className="btn">Новая комната</button></div></header>
          <section className="workspace">
            <div className={`view ${view === 'dashboard' ? 'active' : ''}`}>
              <div className="hero"><h3>Диспетчерская рабочего контура</h3><p>После входа пользователь видит активные комнаты, кто сейчас в голосе, текущее собрание, заявки на вход и инциденты. Это и есть тот слой, который должен жить на домене поверх runtime.</p><div className="mobile-note">На мобильном этот экран должен сворачиваться в короткие блоки и bottom sheets.</div></div>
              <div className="cards">
                <div className="card"><div className="muted">Активные комнаты</div><div className="big">{model.dashboard.activeRooms}</div><div className="hint">Общий, Голосовой, Зал собраний</div></div>
                <div className="card"><div className="muted">Сейчас в голосе</div><div className="big">{model.dashboard.voiceNow}</div><div className="hint">Руководитель · Сотрудник</div></div>
                <div className="card"><div className="muted">Заявки на вход</div><div className="big">{model.dashboard.pendingRequests}</div><div className="hint">1 в голос, 1 в meeting</div></div>
                <div className="card"><div className="muted">Открытые инциденты</div><div className="big">{model.dashboard.incidentsCount}</div><div className="hint">Operator wallboard / moderation</div></div>
              </div>
              <div className="grid-2">
                <div className="card"><div className="row"><h3>Активность комнат</h3><span className="pill green">live</span></div><div className="mini-list"><div className="participant"><div className="left"><div className="indicator live"></div><div><strong>Общий контур</strong><div className="hint">Новые сообщения · {model.roomFeed.length} в ленте</div></div></div><span className="pill">{model.roomMembers.length} онлайн</span></div><div className="participant"><div className="left"><div className="indicator voice"></div><div><strong>Голосовой контур</strong><div className="hint">Координация инцидента и SLA</div></div></div><span className="pill amber">{model.dashboard.voiceNow} в голосе</span></div><div className="participant"><div className="left"><div className="indicator"></div><div><strong>Зал собраний</strong><div className="hint">Следующее собрание в {model.meeting.nextMeetingTime}</div></div></div><span className="pill">закрыт</span></div></div></div>
                <div className="card"><div className="row"><h3>Быстрые действия</h3><span className="pill">priority 1</span></div><div className="mini-list"><div className="participant"><div className="left"><div className="kind group">+</div><div><strong>Создать комнату</strong><div className="hint">Group / Voice / Meeting</div></div></div></div><div className="participant"><div className="left"><div className="kind voice">↗</div><div><strong>Одобрить вход</strong><div className="hint">{model.dashboard.pendingRequests} заявки ожидают модерации</div></div></div></div><div className="participant"><div className="left"><div className="kind meeting">⚑</div><div><strong>Открыть инциденты</strong><div className="hint">{model.dashboard.incidentsCount} открытый P1</div></div></div></div></div></div>
              </div>
            </div>

            <div className={`view ${view === 'room' ? 'active' : ''}`}>
              <div className="grid-2"><div className="card"><div className="row"><h3>Общий контур</h3><span className="pill green">open</span></div><div className="feed">{model.roomFeed.map((message) => <div className="message" key={message.id}><div className="avatar">{message.avatar}</div><div className="body"><strong>{message.title}</strong><span>{message.time}</span><div>{message.text}</div></div></div>)}</div><div className="composer"><input value="runtime smoke message / product-first preview" readOnly /><button className="btn">Отправить</button></div></div><div className="card"><div className="row"><h3>Контекст комнаты</h3><span className="pill">{model.roomMembers.length} участника</span></div><div className="participants">{model.roomMembers.map((member) => <div className="participant" key={member.id}><div className="left"><div className="avatar">{member.avatar}</div><div><strong>{member.name}</strong><div className="hint">{member.role}</div></div></div><span className={`pill ${member.status.tone === 'green' ? 'green' : member.status.tone === 'amber' ? 'amber' : ''}`}>{member.status.label}</span></div>)}</div></div></div>
            </div>

            <div className={`view ${view === 'voice' ? 'active' : ''}`}>
              <div className="grid-2"><div className="card"><div className="row"><h3>Голосовой контур</h3><span className="pill amber">knock</span></div><div className="cards" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',marginTop:14}}><div className="card" style={{padding:14}}><div className="muted">В комнате</div><div className="big" style={{fontSize:24}}>{model.voiceMembers.filter((item) => item.status.label !== 'ожидает').length}</div></div><div className="card" style={{padding:14}}><div className="muted">Ожидают вход</div><div className="big" style={{fontSize:24}}>{model.dashboard.pendingRequests}</div></div><div className="card" style={{padding:14}}><div className="muted">Инцидент</div><div className="big" style={{fontSize:24}}>P1</div></div></div><div className="participants" style={{marginTop:14}}>{model.voiceMembers.map((member) => <div className="participant" key={member.id}><div className="left"><div className={`indicator ${member.status.tone === 'green' ? 'voice' : member.status.tone === 'amber' ? 'live' : ''}`}></div><div><strong>{member.name}</strong><div className="hint">{member.role}</div></div></div><span className={`pill ${member.status.tone === 'green' ? 'green' : member.status.tone === 'amber' ? 'amber' : ''}`}>{member.status.label}</span></div>)}</div><div className="row" style={{marginTop:16,justifyContent:'flex-start',gap:10}}><button className="btn">Войти в голос</button><button className="btn secondary">Отключить звук</button><button className="btn ghost">Устройства</button></div></div><div className="card"><div className="row"><h3>Модерация</h3><span className="pill">2 уровень</span></div><div className="mini-list"><div className="participant"><div className="left"><div className="kind voice">✓</div><div><strong>Одобрить вход</strong><div className="hint">{model.dashboard.pendingRequests} пользователь в очереди</div></div></div></div><div className="participant"><div className="left"><div className="kind voice">⇢</div><div><strong>Переместить в meeting</strong><div className="hint">Из голоса в зал собраний</div></div></div></div><div className="participant"><div className="left"><div className="kind voice">🔇</div><div><strong>Mute / remove</strong><div className="hint">Dangerous actions вынесены вниз</div></div></div></div></div></div></div>
            </div>

            <div className={`view ${view === 'meeting' ? 'active' : ''}`}>
              <div className="card"><div className="row"><h3>Зал собраний</h3><span className="pill">{model.meeting.nextMeetingTime}</span></div><div className="tabs" style={{margin:'14px 0 16px'}}>{model.meeting.tabs.map((tab) => <button key={tab} className={`tab ${meetingTab === tab ? 'active' : ''}`} onClick={() => setMeetingTab(tab)}>{tab === 'participants' ? 'Участники' : tab === 'agenda' ? 'Повестка' : tab === 'materials' ? 'Материалы' : tab === 'log' ? 'Журнал' : 'Итог'}</button>)}</div>{meetingTab === 'participants' ? <div className="participants">{model.roomMembers.map((member) => <div className="participant" key={member.id}><div className="left"><div className="avatar">{member.avatar}</div><div><strong>{member.name}</strong><div className="hint">{member.role.includes('leader') ? 'Ведущий' : member.role.includes('admin') ? 'Управление и контроль' : 'Исполнитель'}</div></div></div><span className={`pill ${member.role.includes('leader') ? 'green' : ''}`}>{member.role.includes('leader') ? 'host' : member.role}</span></div>)}</div> : null}{meetingTab === 'agenda' ? <div className="timeline">{model.meeting.agenda.map((item) => <div className="timeline-item" key={item.title}><strong>{item.title}</strong><div className="hint">{item.hint}</div></div>)}</div> : null}{meetingTab === 'materials' ? <div className="mini-list"><div className="participant"><div className="left"><div className="kind meeting">📄</div><div><strong>План priority 1</strong><div className="hint">Shell · Dashboard · Voice</div></div></div></div><div className="participant"><div className="left"><div className="kind meeting">📎</div><div><strong>SLA incident notes</strong><div className="hint">Операционный пакет</div></div></div></div></div> : null}{meetingTab === 'log' ? <div className="timeline"><div className="timeline-item"><strong>14:00</strong><div className="hint">Встреча открыта ведущим.</div></div><div className="timeline-item"><strong>14:06</strong><div className="hint">Принято решение держать единый room-based deploy path.</div></div><div className="timeline-item"><strong>14:18</strong><div className="hint">Назначен cleanup shell/dashboard/voice.</div></div></div> : null}{meetingTab === 'result' ? <div className="hero" style={{marginTop:8}}><h3>Итог собрания</h3><p>Контур остаётся единым. Следующий обязательный результат — frontend bridge и полезная информация на домене сразу после входа.</p></div> : null}</div>
            </div>

            <div className={`view ${view === 'admin' ? 'active' : ''}`}>
              <div className="admin-grid"><div className="admin-panel"><div className="row"><h3>Overview</h3><span className="pill green">stable</span></div><div className="hint">Graceful degradation: один widget не валит весь экран.</div><div className="cards" style={{gridTemplateColumns:'1fr 1fr',marginTop:12}}><div className="card" style={{padding:12}}><div className="muted">Users</div><div className="big" style={{fontSize:22}}>{model.roomMembers.length + 21}</div></div><div className="card" style={{padding:12}}><div className="muted">Rooms</div><div className="big" style={{fontSize:22}}>{model.dashboard.activeRooms}</div></div></div></div><div className="admin-panel"><div className="row"><h3>Users</h3><span className="pill">операции</span></div><div className="mini-list" style={{marginTop:10}}>{model.roomMembers.slice(0,2).map((member) => <div className="participant" key={member.id}><div className="left"><div className="avatar">{member.avatar}</div><div><strong>{member.name}</strong><div className="hint">{member.role}</div></div></div><span className="pill green">online</span></div>)}</div></div><div className="admin-panel"><div className="row"><h3>Rooms</h3><span className="pill">filtered</span></div><div className="hint">Архив и active rooms разделены. Тестовый мусор не доминирует.</div></div><div className="admin-panel"><div className="row"><h3>System</h3><span className="pill">safe defaults</span></div><div className="hint">Brand, policy, release-meta и org fields должны жить без падения экрана.</div></div><div className="admin-panel"><div className="row"><h3>Invitations</h3><span className="pill amber">2 pending</span></div><div className="hint">Invitation flow не должен давать 500 даже на пустой таблице.</div></div><div className="admin-panel"><div className="row"><h3>Audit</h3><span className="pill">journal</span></div><div className="hint">Компактный рабочий журнал вместо текстовой простыни.</div></div></div>
            </div>
          </section>
        </main>

        <aside className="context"><div className="context-box"><h3>Сводка контекста</h3><div className="metric-line"><span className="muted">Baseline</span><strong>{model.context.baseline}</strong></div><div className="metric-line"><span className="muted">Контур</span><strong>{model.context.contour}</strong></div><div className="metric-line"><span className="muted">Домен</span><strong>{model.context.domain}</strong></div><div className="metric-line"><span className="muted">Статус</span><strong style={{color:'#86efac'}}>{model.context.runtimeStatus}</strong></div></div><div className="context-box"><h3>Почему на домене мало информации</h3><div className="hint">Потому что живой runtime уже есть, а product-first shell/dashboard/voice слой ещё не влит в фронтовой монолит.</div></div><div className="context-box"><h3>Очередь active contour</h3><div className="mini-list"><div className="participant"><div className="left"><div className="kind group">A</div><div><strong>Shared layer</strong><div className="hint">api, constants, tokens, groupings</div></div></div></div><div className="participant"><div className="left"><div className="kind group">B</div><div><strong>App.jsx rewrite</strong><div className="hint">bootstrap only</div></div></div></div><div className="participant"><div className="left"><div className="kind group">C</div><div><strong>Feature layer</strong><div className="hint">shell, auth, room, voice</div></div></div></div><div className="participant"><div className="left"><div className="kind group">D</div><div><strong>Cleanup</strong><div className="hint">debug strip, duplicate helpers</div></div></div></div></div></div></aside>
      </div>
    </div>
  );
}
