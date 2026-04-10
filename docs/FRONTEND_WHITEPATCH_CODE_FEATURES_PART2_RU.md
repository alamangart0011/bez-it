# FRONTEND WHITEPATCH CODE — FEATURES PART 2

## `frontend/src/features/sidebar/Sidebar.jsx`

```jsx
import { BRANDING_DEFAULTS } from '../../shared/branding/defaults';
import { getMeetingRooms, getTextRooms, getVoiceRooms } from '../../shared/rooms/collections';
import { C } from '../../shared/ui/tokens';
import { IBtn } from '../../shared/ui/primitives';

export function Sidebar({ user, rooms, room, unread, voiceParticipants, micOn, onRoomSelect, onOpenModal, onLogout, onToggleMic }) {
  const textRooms = getTextRooms(rooms);
  const voiceRooms = getVoiceRooms(rooms);
  const meetingRooms = getMeetingRooms(rooms);

  return (
    <div style={{ width: 284, background: C.bg1, borderRight: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 46, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: `1px solid ${C.brd}`, gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>С</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{BRANDING_DEFAULTS.appName}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        <SidebarSection label='Текстовые' onAdd={() => onOpenModal('create_room')}>
          {textRooms.map((item) => (
            <RoomLink key={item.id} room={item} active={room?.id === item.id} unread={unread[item.id] || 0} onClick={() => onRoomSelect(item)} icon='#' />
          ))}
        </SidebarSection>

        <SidebarSection label='Голосовые' onAdd={() => onOpenModal('create_room')}>
          {voiceRooms.map((item) => (
            <RoomLink key={item.id} room={item} active={room?.id === item.id} onClick={() => onRoomSelect(item)} icon='🎙' badge={room?.id === item.id ? voiceParticipants.length : 0} />
          ))}
        </SidebarSection>

        <SidebarSection label='Собрания' onAdd={() => onOpenModal('create_room')}>
          {meetingRooms.map((item) => (
            <RoomLink key={item.id} room={item} active={room?.id === item.id} onClick={() => onRoomSelect(item)} icon='📋' />
          ))}
        </SidebarSection>
      </div>

      <div style={{ padding: 8, borderTop: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>{user?.displayName}</div>
          <div style={{ fontSize: 10, color: C.txt3 }}>{user?.role || 'В сети'}</div>
        </div>
        <IBtn icon={micOn ? '🎤' : '🔇'} title='Микрофон' active={!micOn} onClick={onToggleMic} />
        <IBtn icon='➕' title='Создать комнату' onClick={() => onOpenModal('create_room')} />
        <IBtn icon='⎋' title='Выйти' onClick={onLogout} />
      </div>
    </div>
  );
}

function SidebarSection({ label, onAdd, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.txt3 }}>{label}</span>
        <button onClick={onAdd} style={{ background: 'none', border: 'none', color: C.txt3, cursor: 'pointer', fontSize: 16 }}>＋</button>
      </div>
      {children}
    </div>
  );
}

function RoomLink({ room, active, unread, badge, icon, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: active ? C.act : 'transparent', marginBottom: 2 }}>
      <span style={{ width: 16, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: active ? C.acc : C.txt }}>{room.name}</span>
      {badge > 0 && <span style={{ fontSize: 10, color: C.acc }}>{badge}</span>}
      {unread > 0 && <span style={{ fontSize: 10, background: C.red, color: '#fff', borderRadius: 999, padding: '1px 6px' }}>{unread}</span>}
    </div>
  );
}
```

## `frontend/src/features/rooms/RoomViewport.jsx`

```jsx
import { C } from '../../shared/ui/tokens';
import { IBtn } from '../../shared/ui/primitives';
import { MessageList } from '../messages/MessageList';
import { Composer } from '../composer/Composer';

export function RoomViewport({ room, loading, messages, input, setInput, inputRef, messageEndRef, search, setSearch, panel, setPanel, overlay, setOverlay, inVoice, voiceParticipants, user, notify, onOpenModal }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ height: 46, background: C.bg1, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 9, borderBottom: `1px solid ${C.brd}` }}>
        <span style={{ fontSize: 15, color: C.txt3 }}>{room?.kind === 'voice' ? '🎙' : room?.kind === 'meeting' ? '📋' : '#'}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{room?.name || 'Выберите комнату'}</span>
        <div style={{ flex: 1 }} />
        <IBtn icon='🔍' title='Поиск' active={Boolean(search)} onClick={() => setSearch(search ? '' : ' ')} />
        <IBtn icon='👥' title='Участники' active={panel === 'members'} onClick={() => setPanel(panel === 'members' ? 'none' : 'members')} />
        <IBtn icon='➕' title='Добавить участника' onClick={() => onOpenModal('add_member')} />
        <IBtn icon='📺' title='Overlay' active={overlay} onClick={() => setOverlay(!overlay)} />
        {(room?.kind === 'voice' || room?.kind === 'meeting') && <IBtn icon={inVoice ? '📴' : '📞'} title={inVoice ? 'Покинуть' : 'Войти'} active={inVoice} onClick={() => notify('Действие вынесено в voice helpers')} />}
      </div>

      <MessageList room={room} loading={loading} messages={messages} user={user} messageEndRef={messageEndRef} notify={notify} />
      {room && <Composer room={room} input={input} setInput={setInput} inputRef={inputRef} notify={notify} />}
    </div>
  );
}
```

## `frontend/src/features/messages/MessageList.jsx`

```jsx
import { fmtD, fmtT } from '../../shared/lib/formatters';
import { C, avC } from '../../shared/ui/tokens';

export function MessageList({ room, loading, messages, user, messageEndRef }) {
  if (loading) return <div style={{ flex: 1, background: C.bg2, padding: 24, color: C.txt3 }}>Загрузка…</div>;
  if (!room) return <div style={{ flex: 1, background: C.bg2, padding: 24, color: C.txt3 }}>Выберите комнату</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.bg2 }}>
      {messages.map((message, index) => {
        const name = message.user?.displayName || message.user?.username || 'Пользователь';
        return (
          <div key={message.id || index} style={{ padding: message.cont ? '2px 14px 2px 60px' : '8px 14px', borderBottom: `1px solid ${C.brd}10` }}>
            {message.nd && <div style={{ fontSize: 11, color: C.txt3, marginBottom: 6 }}>{fmtD(message.createdAt)}</div>}
            {!message.cont && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: avC(message.userId) }}>{name}</span>
                <span style={{ fontSize: 11, color: C.txt3 }}>{fmtT(message.createdAt)}</span>
              </div>
            )}
            <div style={{ fontSize: 13, color: C.txt, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</div>
          </div>
        );
      })}
      <div ref={messageEndRef} />
    </div>
  );
}
```

## `frontend/src/features/composer/Composer.jsx`

```jsx
import { C } from '../../shared/ui/tokens';

export function Composer({ room, input, setInput, inputRef, notify }) {
  function handleSend() {
    if (!String(input || '').trim()) return;
    notify('Отправка будет подключена через message actions');
  }

  return (
    <div style={{ padding: '0 14px 12px', background: C.bg2 }}>
      <div style={{ background: C.bg1, border: `1px solid ${C.brd}`, borderRadius: 10, display: 'flex', alignItems: 'flex-end', gap: 7, padding: '8px 10px' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Написать в #${room?.name}...`}
          rows={1}
          style={{ flex: 1, background: 'transparent', border: 'none', color: C.txt, fontSize: 13, resize: 'none', outline: 'none', minHeight: 22, maxHeight: 160, lineHeight: 1.55, fontFamily: 'inherit' }}
        />
        <button onClick={handleSend} style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() ? C.acc : C.bg3, border: 'none', color: input.trim() ? '#fff' : C.txt3, cursor: input.trim() ? 'pointer' : 'default' }}>➤</button>
      </div>
    </div>
  );
}
```
