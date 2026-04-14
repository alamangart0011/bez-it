import React, { useMemo, useState } from 'react';
import { buildRoomBasedPreviewModel, ROOM_BASED_ROLE_PRESETS } from './buildRoomBasedPreviewModel.js';

const C = {
  bg: '#0b1220',
  panel: '#101a2c',
  panel2: '#132038',
  line: '#24324d',
  txt: '#e7edf8',
  muted: '#9fb0cc',
  soft: '#7f93b7',
  acc: '#2563eb',
  ok: '#22c55e',
  warn: '#f59e0b',
};

function card(padding = 16) {
  return {
    background: 'linear-gradient(180deg,rgba(16,26,44,.98),rgba(12,20,34,.98))',
    border: `1px solid ${C.line}`,
    borderRadius: 18,
    padding,
    minWidth: 0,
  };
}

function pill(tone = 'default') {
  const map = {
    default: { background: '#1b2a45', color: '#b8c7e1' },
    green: { background: '#123223', color: '#86efac' },
    amber: { background: '#3a250a', color: '#fdba74' },
  };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    ...(map[tone] || map.default),
  };
}

function navBtn(active) {
  return {
    border: `1px solid ${active ? '#355087' : C.line}`,
    background: active ? C.panel2 : C.panel,
    color: C.txt,
    borderRadius: 14,
    padding: 12,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  };
}

function actionBtn(primary = false, disabled = false) {
  return {
    border: `1px solid ${primary ? '#3b82f6' : C.line}`,
    background: primary ? C.acc : C.panel2,
    color: '#fff',
    padding: '10px 12px',
    borderRadius: 12,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
  };
}

export default function SignalumRoomBasedPreviewV2(props) {
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

  const pageTitle = {
    dashboard: 'Главная',
    room: 'Общий контур',
    voice: 'Голосовой контур',
    meeting: 'Зал собраний',
    admin: 'Админ-центр',
  }[view] || 'Signalum';

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '280px minmax(0,1fr) 320px', background: 'linear-gradient(180deg,#08101d 0%,#0b1220 100%)', color: C.txt, fontFamily: 'Inter,Arial,Helvetica,sans-serif' }}>
      <aside style={{ background: 'rgba(14,22,37,.86)', borderRight: `1px solid ${C.line}`, paddingBottom: 18 }}>
        <div style={{ padding: '22px 20px 14px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,#2563eb,#38bdf8)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 19 }}>S</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Signalum</div>
              <div style={{ color: C.muted, fontSize: 12 }}>Room-based V17 · активный live-контур</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 16, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: C.soft, marginBottom: 12 }}>Навигация</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {model.navRooms.map((item) => (
              <button key={item.key} onClick={() => setView(item.key)} style={navBtn(view === item.key)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, background: item.kind === 'voice' ? '#10382f' : item.kind === 'meeting' ? '#2a1d54' : '#173157', color: item.kind === 'voice' ? '#5eead4' : item.kind === 'meeting' ? '#c4b5fd' : '#93c5fd' }}>{item.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{item.subtitle}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 16, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: C.soft, marginBottom: 12 }}>Быстрые блоки</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={card(12)}><div style={{ fontWeight: 700, fontSize: 13 }}>Заявки на вход</div><div style={{ color: C.muted, fontSize: 11 }}>{model.dashboard.pendingRequests || 0} ожидают решения</div></div>
            <div style={card(12)}><div style={{ fontWeight: 700, fontSize: 13 }}>Инциденты</div><div style={{ color: C.muted, fontSize: 11 }}>{model.dashboard.incidentsCount || 0} в работе</div></div>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div style={card(14)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: '#243b66', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{model.rolePreset.avatar}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{model.rolePreset.name}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{model.rolePreset.role}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(ROOM_BASED_ROLE_PRESETS).map(([key, value]) => (
                <button key={key} onClick={() => setRoleView(key)} style={{ border: `1px solid ${roleView === key ? '#3d61a8' : C.line}`, background: roleView === key ? '#1b2e56' : '#0f1728', color: roleView === key ? '#fff' : C.muted, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12 }}>{value.name}</button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C.line}`, background: 'rgba(10,17,30,.78)', gap: 18 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{pageTitle}</div>
            <div style={{ marginTop: 6, color: C.muted, fontSize: 13 }}>Preview bridge активен поверх room-based baseline</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button style={actionBtn(false)}>Команды</button>
            <button style={actionBtn(false)}>Приглашения</button>
            <button style={actionBtn(true)}>Новая комната</button>
          </div>
        </header>

        <section style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          {view === 'dashboard' ? (
            <>
              <div style={{ padding: 18, borderRadius: 18, background: 'linear-gradient(135deg,rgba(37,99,235,.22),rgba(59,130,246,.06))', border: '1px solid rgba(59,130,246,.28)' }}>
                <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>Диспетчерская рабочего контура</div>
                <div style={{ color: '#c9d8f3', maxWidth: 820, lineHeight: 1.5 }}>После входа пользователь видит активные комнаты, кто сейчас в голосе, текущее собрание, заявки на вход и инциденты. Preview bridge уже подключён к live runtime.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
                <div style={card()}><div style={{ color: C.muted }}>Активные комнаты</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.activeRooms}</div></div>
                <div style={card()}><div style={{ color: C.muted }}>Сейчас в голосе</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.voiceNow}</div></div>
                <div style={card()}><div style={{ color: C.muted }}>Заявки на вход</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.pendingRequests}</div></div>
                <div style={card()}><div style={{ color: C.muted }}>Инциденты</div><div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{model.dashboard.incidentsCount}</div></div>
              </div>
            </>
          ) : null}

          {view === 'room' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(280px,.8fr)', gap: 18 }}>
              <div style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Общий контур</div><span style={pill('green')}>open</span></div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {model.roomFeed.map((message) => (
                    <div key={message.id} style={{ display: 'flex', gap: 12, padding: 12, border: `1px solid ${C.line}`, background: '#111b2c', borderRadius: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: '#243b66', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>{message.avatar}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{message.title}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{message.time}</div>
                        <div style={{ lineHeight: 1.5 }}>{message.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Контекст комнаты</div><span style={pill('green')}>{model.roomMembers.length} участника</span></div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {model.roomMembers.map((member) => <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}><div style={{ width: 36, height: 36, borderRadius: 12, background: '#243b66', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{member.avatar}</div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 700 }}>{member.name}</div><div style={{ fontSize: 12, color: C.muted }}>{member.role}</div></div></div><span style={pill(member.status.tone)}>{member.status.label}</span></div>)}
                </div>
              </div>
            </div>
          ) : null}

          {view === 'voice' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(280px,.8fr)', gap: 18 }}>
              <div style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Голосовой контур</div><span style={pill('amber')}>knock</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14, marginBottom: 14 }}>
                  <div style={card(14)}><div style={{ color: C.muted }}>В комнате</div><div style={{ fontSize: 24, fontWeight: 800 }}>{model.voiceMembers.filter((item) => item.status.label !== 'ожидает').length}</div></div>
                  <div style={card(14)}><div style={{ color: C.muted }}>Ожидают вход</div><div style={{ fontSize: 24, fontWeight: 800 }}>{model.dashboard.pendingRequests}</div></div>
                  <div style={card(14)}><div style={{ color: C.muted }}>Инциденты</div><div style={{ fontSize: 24, fontWeight: 800 }}>{model.dashboard.incidentsCount}</div></div>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {model.voiceMembers.map((member) => <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 9, height: 9, borderRadius: 999, background: member.status.tone === 'green' ? '#2dd4bf' : '#3b4b6c' }} /><div><div style={{ fontWeight: 700 }}>{member.name}</div><div style={{ fontSize: 12, color: C.muted }}>{member.role}</div></div></div><span style={pill(member.status.tone)}>{member.status.label}</span></div>)}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <button style={actionBtn(true)}>Войти в голос</button>
                  <button style={actionBtn(false)}>Отключить звук</button>
                  <button style={actionBtn(false)}>Устройства</button>
                </div>
              </div>
              <div style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontWeight: 800 }}>Модерация</div><span style={pill()}>role-aware</span></div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ padding: 12, borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ fontWeight: 700 }}>Одобрить вход</div><div style={{ fontSize: 12, color: C.muted }}>Действие показывается только там, где роль уже позволяет его выполнить.</div></div>
                  <div style={{ padding: 12, borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ fontWeight: 700 }}>Переместить в meeting</div><div style={{ fontSize: 12, color: C.muted }}>Лишние действия не вываливаются поверх экрана ошибкой прав.</div></div>
                </div>
              </div>
            </div>
          ) : null}

          {view === 'meeting' ? (
            <div style={card()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 16, flexWrap: 'wrap' }}><div style={{ fontWeight: 800 }}>Зал собраний</div><span style={pill()}>{model.meeting.nextMeetingTime}</span></div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {model.meeting.tabs.map((tab) => <button key={tab} onClick={() => setMeetingTab(tab)} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${meetingTab === tab ? '#36579a' : C.line}`, background: meetingTab === tab ? '#1c2d52' : '#121d31', color: meetingTab === tab ? '#fff' : C.muted, cursor: 'pointer' }}>{tab}</button>)}
              </div>
              {meetingTab === 'participants' ? <div style={{ display: 'grid', gap: 10 }}>{model.roomMembers.map((member) => <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 12, background: '#243b66', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{member.avatar}</div><div><div style={{ fontWeight: 700 }}>{member.name}</div><div style={{ fontSize: 12, color: C.muted }}>{member.role}</div></div></div><span style={pill(member.role.includes('admin') ? 'default' : 'green')}>{member.role.includes('leader') ? 'host' : member.role}</span></div>)}</div> : null}
              {meetingTab === 'agenda' ? <div style={{ display: 'grid', gap: 10 }}>{model.meeting.agenda.map((item) => <div key={item.title} style={{ padding: 12, borderLeft: '3px solid #36579a', background: '#101a2b', borderRadius: '0 12px 12px 0' }}><div style={{ fontWeight: 700 }}>{item.title}</div><div style={{ fontSize: 12, color: C.muted }}>{item.hint}</div></div>)}</div> : null}
              {meetingTab === 'materials' ? <div style={{ display: 'grid', gap: 10 }}><div style={{ padding: 12, borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}>План priority 1</div><div style={{ padding: 12, borderRadius: 14, background: '#10192b', border: `1px solid ${C.line}` }}>SLA incident notes</div></div> : null}
              {meetingTab === 'log' ? <div style={{ display: 'grid', gap: 10 }}><div style={{ padding: 12, borderLeft: '3px solid #36579a', background: '#101a2b', borderRadius: '0 12px 12px 0' }}>14:00 · Встреча открыта ведущим.</div><div style={{ padding: 12, borderLeft: '3px solid #36579a', background: '#101a2b', borderRadius: '0 12px 12px 0' }}>14:06 · Принято решение держать единый room-based deploy path.</div></div> : null}
              {meetingTab === 'result' ? <div style={{ padding: 18, borderRadius: 18, background: 'linear-gradient(135deg,rgba(37,99,235,.22),rgba(59,130,246,.06))', border: '1px solid rgba(59,130,246,.28)' }}><div style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>Итог собрания</div><div style={{ color: '#c9d8f3', lineHeight: 1.5 }}>Preview bridge уже активен. Следующий обязательный результат — role-aware действия и cleanup live-shell без визуального шума.</div></div> : null}
            </div>
          ) : null}

          {view === 'admin' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              {['Overview','Users','Rooms','System','Invitations','Audit'].map((title, index) => <div key={title} style={{ background: '#101a2d', border: `1px solid ${C.line}`, borderRadius: 16, padding: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div style={{ fontWeight: 800 }}>{title}</div><span style={pill(index === 0 ? 'green' : index === 4 ? 'amber' : 'default')}>{index === 0 ? 'stable' : index === 4 ? '2 pending' : 'операции'}</span></div><div style={{ fontSize: 12, color: C.muted }}>Админ-виджеты должны показывать только полезные данные и не ломать рабочий экран overlay-ошибками.</div></div>)}
            </div>
          ) : null}
        </section>
      </main>

      <aside style={{ background: 'rgba(14,22,37,.86)', borderLeft: `1px solid ${C.line}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={card()}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Сводка контекста</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Baseline</span><strong>{model.context.baseline}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Контур</span><strong>{model.context.contour}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Домен</span><strong>{model.context.domain}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: C.muted }}>Статус</span><strong style={{ color: '#86efac' }}>{model.context.runtimeStatus}</strong></div>
          </div>
        </div>
        <div style={card()}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Состояние слоя</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Preview bridge уже работает на live-домене. Текущий фокус — visual cleanup, role-aware actions и повторяемая browser acceptance без лишнего UI-шума.</div>
        </div>
      </aside>
    </div>
  );
}
