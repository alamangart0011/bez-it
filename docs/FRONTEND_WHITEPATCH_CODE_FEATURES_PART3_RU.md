# FRONTEND WHITEPATCH CODE — FEATURES PART 3

## `frontend/src/features/members/MembersPanel.jsx`

```jsx
import { C } from '../../shared/ui/tokens';

export function MembersPanel({ user, members, voiceParticipants, onOpenModal }) {
  const safeMembers = (members || []).filter(Boolean);
  const deptMap = safeMembers.reduce((acc, member) => {
    const key = member.department || 'Сотрудники';
    if (!acc[key]) acc[key] = [];
    acc[key].push(member);
    return acc;
  }, {});

  return (
    <div style={{ width: 260, background: C.bg1, borderLeft: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.txt3 }}>Участники — {safeMembers.length + 1}</span>
        <button onClick={() => onOpenModal('add_member')} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.brd}`, background: 'transparent', cursor: 'pointer', color: C.txt3 }}>＋</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        <SectionTitle label={`В сети — ${safeMembers.length + 1}`} />
        <MemberRow member={user} isMe voiceParticipants={voiceParticipants} />
        {Object.entries(deptMap).map(([dept, items]) => (
          <div key={dept}>
            <SectionTitle label={`${dept} — ${items.length}`} />
            {items.map((member) => (
              <MemberRow key={member.id} member={member} voiceParticipants={voiceParticipants} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ label }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: C.txt3, padding: '8px 6px 4px' }}>{label}</div>;
}

function MemberRow({ member, isMe, voiceParticipants }) {
  if (!member) return null;
  const inVoice = (voiceParticipants || []).some((item) => (item.userId || item.id) === member.id);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, marginBottom: 2 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.txt }}>
        {(member.displayName || '?').slice(0, 1).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.txt }}>{member.displayName}{isMe ? ' (вы)' : ''}</div>
        <div style={{ fontSize: 11, color: inVoice ? C.acc : C.txt3 }}>{inVoice ? '🎙 В голосе' : member.role || 'В сети'}</div>
      </div>
    </div>
  );
}
```

## `frontend/src/features/overlay/VoiceOverlay.jsx`

```jsx
import { C } from '../../shared/ui/tokens';

export function VoiceOverlay({ parts, micOn, onMic, onLeave, onClose }) {
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 16, width: 220, background: C.bg1, borderRadius: 12, border: `1px solid ${C.brd}`, boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 1000 }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.grn }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.txt, flex: 1 }}>Голосовой контур</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.txt3, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(parts || []).length === 0 ? (
          <div style={{ fontSize: 12, color: C.txt3, textAlign: 'center', padding: 8 }}>Никого нет в голосе</div>
        ) : (
          (parts || []).map((item) => (
            <div key={item.userId || item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{(item.displayName || item.username || '?').slice(0, 1).toUpperCase()}</div>
              <span style={{ flex: 1, fontSize: 12, color: C.txt }}>{item.displayName || item.username}</span>
              <span style={{ fontSize: 11, color: item.isMuted ? C.txt3 : C.grn }}>{item.isMuted ? '🔇' : '🎤'}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.brd}`, display: 'flex', gap: 6 }}>
        <button onClick={onMic} style={{ flex: 1, padding: '7px 6px', borderRadius: 8, border: `1px solid ${C.brd}`, background: micOn ? C.act : C.bg3, color: micOn ? C.acc : C.txt, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>{micOn ? '🎤 Вкл' : '🔇 Выкл'}</button>
        <button onClick={onLeave} style={{ flex: 1, padding: '7px 6px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>☎ Выйти</button>
      </div>
    </div>
  );
}
```

## `frontend/src/features/command-palette/CommandPalette.jsx`

```jsx
import { C } from '../../shared/ui/tokens';

export function CommandPalette({ open, setOpen, query, setQuery, rooms, onRoomSelect, onOpenModal }) {
  if (!open) return null;

  const items = [
    ...(rooms || []).map((room) => ({ icon: room.kind === 'voice' ? '🎙' : room.kind === 'meeting' ? '📋' : '#', label: room.name, action: () => { onRoomSelect(room); setOpen(false); } })),
    { icon: '＋', label: 'Создать комнату', action: () => { onOpenModal('create_room'); setOpen(false); } },
    { icon: '👥', label: 'Добавить участника', action: () => { onOpenModal('add_member'); setOpen(false); } },
  ].filter((item) => !query || item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000, paddingTop: 120 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ background: C.bg1, borderRadius: 12, width: 520, maxWidth: '95vw', boxShadow: '0 16px 64px rgba(0,0,0,.2)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${C.brd}` }}>
          <span style={{ fontSize: 16, color: C.txt3 }}>🔍</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Поиск комнат, действий...' autoFocus style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: C.txt, outline: 'none', fontFamily: 'inherit' }} />
          <span style={{ fontSize: 11, color: C.txt3 }}>ESC</span>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {items.map((item, index) => (
            <div key={index} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.brd}` }}>
              <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: C.txt, fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## `frontend/src/features/modals/ModalsRoot.jsx`

```jsx
import { Btn, Inp, Modal } from '../../shared/ui/primitives';

export function ModalsRoot({ modal, modalData, closeModal, newRoomName, setNewRoomName, newRoomKind, setNewRoomKind, memberSearch, setMemberSearch, creating }) {
  if (!modal) return null;

  if (modal === 'create_room') {
    return (
      <Modal title='Создать комнату' onClose={closeModal} width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Inp value={newRoomName} onChange={(event) => setNewRoomName(event.target.value)} placeholder='общий-контур' autoFocus />
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              ['group', 'Текстовая'],
              ['voice', 'Голосовая'],
              ['meeting', 'Собрание'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setNewRoomKind(key)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant='ghost' onClick={closeModal}>Отмена</Btn>
            <Btn variant='primary' disabled={creating || !newRoomName.trim()}>Создать</Btn>
          </div>
        </div>
      </Modal>
    );
  }

  if (modal === 'add_member') {
    return (
      <Modal title='Добавить участника' onClose={closeModal} width={460}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Inp value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder='Поиск по имени или email...' autoFocus />
          <Btn variant='ghost' onClick={closeModal}>Закрыть</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title='Модальное окно' onClose={closeModal} width={420}>
      <div>{modalData?.name || 'Подключить конкретную реализацию модального окна'}</div>
    </Modal>
  );
}
```
