import React, { useMemo, useState } from 'react';
import { buildRoomBasedPreviewModel, ROOM_BASED_ROLE_PRESETS } from './buildRoomBasedPreviewModel.js';

const C = {
  bg: '#0b1220',
  panel: '#121c2f',
  panel2: '#17233a',
  line: '#24324d',
  txt: '#e7edf8',
  muted: '#9fb0cc',
  soft: '#7f93b7',
  acc: '#2563eb',
  ok: '#22c55e',
  warn: '#f59e0b',
  voice: '#0f7b6c',
  meeting: '#6d28d9',
};

function pillStyle(tone = 'default') {
  const map = {
    default: { background: '#1b2a45', color: '#b8c7e1' },
    green: { background: '#123223', color: '#86efac' },
    amber: { background: '#3a250a', color: '#fdba74' },
    red: { background: '#3d1111', color: '#fca5a5' },
  };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    ...(map[tone] || map.default),
  };
}

function cardStyle() {
  return {
    background: 'linear-gradient(180deg,rgba(18,28,47,.98),rgba(15,22,36,.98))',
    border: `1px solid ${C.line}`,
    borderRadius: 18,
    padding: 16,
  };
}

function NavItem({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{ border: `1px solid ${active ? '#355087' : C.line}`, background: active ? C.panel2 : C.panel, color: C.txt, borderRadius: 14, padding: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, background: item.kind === 'voice' ? '#10382f' : item.kind === 'meeting' ? '#2a1d54' : '#173157', color: item.kind === 'voice' ? '#5eead4' : item.kind === 'meeting' ? '#c4b5fd' : '#93c5fd' }}>{item.icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{item.subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function RoleSwitch({ roleView, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {Object.entries(ROOM_BASED_ROLE_PRESETS).map(([key, value]) => (
        <button key={key} onClick={() => onChange(key)} style={{ border: `1px solid ${roleView === key ? '#3d61a8' : C.line}`, background: roleView === key ? '#1b2e56' : '#0f1728', color: roleView === key ? '#fff' : C.muted, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12 }}>
          {value.name}
        </button>
      ))}
    </div>
  );
}

export default function SignalumRoomBasedPreview(props) {
  const [view, setView] = useState('dashboard');
  const [meetingTab, setMeetingTab] = useState('participants');
  const [roleView, setRoleView] = useState(props.roleView || 'admin');

  const model = useMemo(() => buildRoomBasedPreviewModel({
    roleView,
    user: props.user,
    rooms: props.rooms || [
      { id: 'room-1', name: 'Общий контур', kind: 'group' },
      { id: 'room-2', name: 'Голосовой контур', kind: 'voice' },
      { id: 'room-3', name: 'Зал собраний', kind: 'meeting' },
    ],
    currentRoomId: props.currentRoomId || 'room-1',
    messages: props.messages || [
      { id: 'm1', text: 'Коллеги, держим единый room-based контур.', createdAt: new Date().toISOString(), user: { id: 'u1', name: 'Администратор' } },
      { id: 'm2', text: 'Голосовой контур открыт. Через 15 минут meeting room.', createdAt: new Date().toISOString(), user: { id: 'u2', name: 'Руководитель' } },
    ],
    members: props.members || [
      { id: 'u1', name: 'Администратор', role: 'super_admin' },
      { id: 'u2', name: 'Руководитель', role: 'leader' },
      { id: 'u3', name: 'Сотрудник', role: 'member' },
    ],
    participants: props.participants || [
      { userId: 'u2', displayName: 'Руководитель', handRaised: false, isMuted: false },
      { userId: 'u3', displayName: 'Сотрудник', handRaised: true, isMuted: false },
    ],
    incidentsCount: props.incidentsCount || 1,
    pendingRequests: props.pendingRequests || 2,
    nextMeetingTime: props.nextMeetingTime || '14:00',
  }), [props.user, props.rooms, props.currentRoomId, props.messages, props.members, props.participants, props.incidentsCount, props.pendingRequests, props.nextMeetingTime, roleView]);

  const pageTitle = {
    dashboard: 'Главная',
    room: 'Общий контур',
    voice: 'Голосовой контур',
    meeting: 'Зал собраний',
    admin: 'Админ-центр',
  }[view] || 'Signalum';

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '280px 1fr 340px', background: 'linear-gradient(180deg,#08101d 0%,#0b1220 100%)', color: C.txt, fontFamily: 'Inter,Arial,Helvetica,sans-serif' }}>
      <aside style={{ background: 'rgba(14,22,37,.86)', borderRight: `1px solid ${C.line}`, paddingBottom: 18 }}>
        <div style={{ padding: '22px 20px 14px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,#2563eb,#38bdf8)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 19 }}>S</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Signalum</div>
              <div style={{ color: C.muted, fontSize: 12 }}>Room-based V17 · единый рабочий контур</div>
            </div>
          </div>
        </div>
        <div style={{ padding: 16, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: C.soft, marginBottom: 12 }}>Навигация</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {model.navRooms.map((item) => <NavItem key={item.key} item={item} active={view === item.key} onClick={() => setView(item.key)} />)}
          </div>
        </div>
        <div style={{ padding: 16, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: C.soft, marginBottom: 12 }}>Быстрые блоки</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...cardStyle(), padding: 12 }}><div style={{ fontWeight: 700, fontSize: 13 }}>Заявки на вход</div><div style={{ color: C.muted, fontSize: 11 }}>{model.dashboard.pendingRequests || 2} ожидают решения</div></div>
            <div style={{ ...cardStyle(), padding: 12 }}><div style={{ fontWeight: 700, fontSize: 13 }}>Инциденты</div><div style={{ color: C.muted, fontSize: 11 }}>{model.dashboard.incidentsCount || 1} открыт · 3 в работе</div></div>
          </div>
        </div>
        <div style={{ padding: 16, marginTop: 'auto' }}>
          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: '#243b66', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{model.rolePreset.avatar}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{model.rolePreset.name}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{model.rolePreset.role}</div>
              </div>
            </div>
            <RoleSwitch roleView={roleView} onChange={setRoleView} />
          </div>
        </div>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C.line}`, background: 'rgba(10,17,30,.78)' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{pageTitle}</div>
            <div style={{ marginTop: 6, color: C.muted, fontSize: 13 }}>Product-first shell на room-based baseline</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ border: `1px solid ${C.line}`, background: '#17253c', color: '#dbe7ff', padding: '11px 14px', borderRadius: 12, fontWeight: 700 }}>Команды</button>
            <button style={{ border: `1px solid ${C.line}`, background: 'transparent', color: C.txt, padding: '11px 14px', borderRadius: 12, fontWeight: 700 }}>Приглашения</button>
            <button style={{ border: 'none', background: C.acc, color: '#fff', padding: '11px 14px', borderRadius: 12, fontWeight: 700 }}>Новая комната</button>
          </div>
        </header>

        <section style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {view === 'dashboard' ? (
            <>
              <div style={{ padding: 18, borderRadius: 18, background: 'linear-gradient(135deg,rgba(37,99,235,.22),rgba(59,130,246,.06))', border: '1px solid rgba(59,130,246,.28)' }}>
                <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>Диспетчерская рабочего контура</div>
                <div style={{ color: '#c9d8f3', maxWidth: 820, lineHeight: 1.5 }}>После входа пользователь видит активные комнаты, кто сейчас в голосе, текущее собрание, заявки на вход и инциденты.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
                <div style={cardStyle()}><div style={{ color: C.muted }}>Активные комнаты</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.activeRooms}</div></div>
                <div style={cardStyle()}><div style={{ color: C.muted }}>Сейчас в голосе</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.voiceNow}</div></div>
                <div style={cardStyle()}><div style={{ color: C.muted }}>Заявки на вход</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.pendingRequests}</div></div>
                <div style={cardStyle()}><div style={{ color: C.muted }}>Открытые инциденты</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.incidentsCount}</div></div>
              </div>
            </>
          ) : null}

          {view === 'room' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .95fr', gap: 18 }}>
              <div style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Общий контур</div><span style={pillStyle('green')}>open</span></div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {model.roomFeed.map((message) => (
                    <div key={message.id} style={{ display: 'flex', gap: 12, padding: 12, border: `1px solid ${C.line}`, background: '#111b2c', borderRadius: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: '#243b66', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>{message.avatar}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{message.title}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{message.time}</div>
                        <div>{message.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <input value="runtime smoke message / product-first preview" readOnly style={{ flex: 1, background: '#0c1525', border: `1px solid ${C.line}`, color: '#fff', borderRadius: 14, padding: '13px 14px' }} />
                  <button style={{ border: 'none', background: C.acc, color: '#fff', padding: '11px 14px', borderRadius: 12, fontWeight: 700 }}>Отправить</button>
                </div>
              </div>
              <div style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Контекст комнаты</div><span style={pillStyle('green')}>{model.roomMembers.length} участника</span></div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {model.roomMembers.map((member) => <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 12, background: '#243b66', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{member.avatar}</div><div><div style={{ fontWeight: 700 }}>{member.name}</div><div style={{ fontSize: 12, color: C.muted }}>{member.role}</div></div></div><span style={pillStyle(member.status.tone)}>{member.status.label}</span></div>)}
                </div>
              </div>
            </div>
          ) : null}

          {view === 'voice' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .95fr', gap: 18 }}>
              <div style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Голосовой контур</div><span style={pillStyle('amber')}>knock</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14, marginBottom: 14 }}>
                  <div style={{ ...cardStyle(), padding: 14 }}><div style={{ color: C.muted }}>В комнате</div><div style={{ fontSize: 24, fontWeight: 800 }}>{model.voiceMembers.filter((item) => item.status.label !== 'ожидает').length}</div></div>
                  <div style={{ ...cardStyle(), padding: 14 }}><div style={{ color: C.muted }}>Ожидают вход</div><div style={{ fontSize: 24, fontWeight: 800 }}>{model.dashboard.pendingRequests}</div></div>
                  <div style={{ ...cardStyle(), padding: 14 }}><div style={{ color: C.muted }}>Инцидент</div><div style={{ fontSize: 24, fontWeight: 800 }}>P1</div></div>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {model.voiceMembers.map((member) => <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 9, height: 9, borderRadius: 999, background: member.status.tone === 'green' ? '#2dd4bf' : '#3b4b6c' }} /><div><div style={{ fontWeight: 700 }}>{member.name}</div><div style={{ fontSize: 12, color: C.muted }}>{member.role}</div></div></div><span style={pillStyle(member.status.tone)}>{member.status.label}</span></div>)}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button style={{ border: 'none', background: C.acc, color: '#fff', padding: '11px 14px', borderRadius: 12, fontWeight: 700 }}>Войти в голос</button>
                  <button style={{ border: `1px solid ${C.line}`, background: '#17253c', color: '#dbe7ff', padding: '11px 14px', borderRadius: 12, fontWeight: 700 }}>Отключить звук</button>
                  <button style={{ border: `1px solid ${C.line}`, background: 'transparent', color: C.txt, padding: '11px 14px', borderRadius: 12, fontWeight: 700 }}>Устройства</button>
                </div>
              </div>
              <div style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Модерация</div><span style={pillStyle()}>2 уровень</span></div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ width: 30, height: 30, borderRadius: 10, background: '#10382f', color: '#5eead4', display: 'grid', placeItems: 'center' }}>✓</div><div><div style={{ fontWeight: 700 }}>Одобрить вход</div><div style={{ fontSize: 12, color: C.muted }}>{model.dashboard.pendingRequests} пользователь в очереди</div></div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ width: 30, height: 30, borderRadius: 10, background: '#10382f', color: '#5eead4', display: 'grid', placeItems: 'center' }}>⇢</div><div><div style={{ fontWeight: 700 }}>Переместить в meeting</div><div style={{ fontSize: 12, color: C.muted }}>Из голоса в зал собраний</div></div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ width: 30, height: 30, borderRadius: 10, background: '#10382f', color: '#5eead4', display: 'grid', placeItems: 'center' }}>🔇</div><div><div style={{ fontWeight: 700 }}>Mute / remove</div><div style={{ fontSize: 12, color: C.muted }}>Dangerous actions вынесены вниз</div></div></div>
                </div>
              </div>
            </div>
          ) : null}

          {view === 'meeting' ? (
            <div style={cardStyle()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><div style={{ fontWeight: 800 }}>Зал собраний</div><span style={pillStyle()}>{model.meeting.nextMeetingTime}</span></div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {model.meeting.tabs.map((tab) => <button key={tab} onClick={() => setMeetingTab(tab)} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${meetingTab === tab ? '#36579a' : C.line}`, background: meetingTab === tab ? '#1c2d52' : '#121d31', color: meetingTab === tab ? '#fff' : C.muted, cursor: 'pointer' }}>{tab}</button>)}
              </div>
              {meetingTab === 'participants' ? <div style={{ display: 'grid', gap: 10 }}>{model.roomMembers.map((member) => <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 12, background: '#243b66', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{member.avatar}</div><div><div style={{ fontWeight: 700 }}>{member.name}</div><div style={{ fontSize: 12, color: C.muted }}>{member.role}</div></div></div><span style={pillStyle(member.role.includes('admin') ? 'default' : 'green')}>{member.role.includes('leader') ? 'host' : member.role}</span></div>)}</div> : null}
              {meetingTab === 'agenda' ? <div style={{ display: 'grid', gap: 10 }}>{model.meeting.agenda.map((item) => <div key={item.title} style={{ padding: 12, borderLeft: '3px solid #36579a', background: '#101a2b', borderRadius: '0 12px 12px 0' }}><div style={{ fontWeight: 700 }}>{item.title}</div><div style={{ fontSize: 12, color: C.muted }}>{item.hint}</div></div>)}</div> : null}
              {meetingTab === 'materials' ? <div style={{ display: 'grid', gap: 10 }}><div style={{ padding: 12, borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}>План priority 1</div><div style={{ padding: 12, borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}>SLA incident notes</div></div> : null}
              {meetingTab === 'log' ? <div style={{ display: 'grid', gap: 10 }}><div style={{ padding: 12, borderLeft: '3px solid #36579a', background: '#101a2b', borderRadius: '0 12px 12px 0' }}>14:00 · Встреча открыта ведущим.</div><div style={{ padding: 12, borderLeft: '3px solid #36579a', background: '#101a2b', borderRadius: '0 12px 12px 0' }}>14:06 · Принято решение держать единый room-based deploy path.</div></div> : null}
              {meetingTab === 'result' ? <div style={{ padding: 18, borderRadius: 18, background: 'linear-gradient(135deg,rgba(37,99,235,.22),rgba(59,130,246,.06))', border: '1px solid rgba(59,130,246,.28)' }}><div style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>Итог собрания</div><div style={{ color: '#c9d8f3', lineHeight: 1.5 }}>Контур остаётся единым. Следующий обязательный результат — frontend bridge и полезная информация на домене сразу после входа.</div></div> : null}
            </div>
          ) : null}

          {view === 'admin' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              {['Overview','Users','Rooms','System','Invitations','Audit'].map((title, index) => <div key={title} style={{ background: '#101a2d', border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div style={{ fontWeight: 800 }}>{title}</div><span style={pillStyle(index === 0 ? 'green' : index === 4 ? 'amber' : 'default')}>{index === 0 ? 'stable' : index === 4 ? '2 pending' : 'операции'}</span></div><div style={{ fontSize: 12, color: C.muted }}>Graceful degradation и product-first layout без полного падения экрана.</div></div>)}
            </div>
          ) : null}
        </section>
      </main>

      <aside style={{ background: 'rgba(14,22,37,.86)', borderLeft: `1px solid ${C.line}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={cardStyle()}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Сводка контекста</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Baseline</span><strong>{model.context.baseline}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Контур</span><strong>{model.context.contour}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Домен</span><strong>{model.context.domain}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Статус</span><strong style={{ color: '#86efac' }}>{model.context.runtimeStatus}</strong></div>
          </div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Почему на домене мало информации</div>
          <div style={{ fontSize: 12, color: C.muted }}>Потому что живой runtime уже есть, а product-first shell/dashboard/voice слой ещё не влит в фронтовой монолит.</div>
        </div>
      </aside>
    </div>
  );
}
