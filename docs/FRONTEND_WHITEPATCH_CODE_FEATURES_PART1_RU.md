# FRONTEND WHITEPATCH CODE — FEATURES PART 1

## `frontend/src/shared/ui/primitives.jsx`

```jsx
import { useEffect, useState } from 'react';
import { C } from '../ui/tokens';

export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            right: 'calc(100% + 8px)',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#18191c',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            padding: '5px 10px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            zIndex: 200,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,.3)',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

export function IBtn({ icon, title, active, danger, badge, onClick }) {
  const [hovered, setHovered] = useState(false);
  const background = hovered || active ? (danger ? `${C.red}15` : C.act) : 'transparent';
  const color = hovered || active ? (danger ? C.red : C.acc) : C.txt3;
  return (
    <Tooltip text={title}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          background,
          color,
          transition: 'all .1s',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {icon}
        {badge > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: C.red,
              fontSize: 8,
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1.5px solid ${C.bg1}`,
            }}
          >
            {badge > 9 ? '9+' : badge}
          </div>
        )}
      </div>
    </Tooltip>
  );
}

export function Btn({ children, onClick, variant = 'default', disabled, small, sx = {} }) {
  const variants = {
    default: { bg: C.bg3, cl: C.txt, bd: `1px solid ${C.brd}` },
    primary: { bg: C.acc, cl: '#fff', bd: 'none' },
    danger: { bg: C.red, cl: '#fff', bd: 'none' },
    ghost: { bg: 'transparent', cl: C.txt2, bd: `1px solid ${C.brd}` },
  };
  const current = variants[variant] || variants.default;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: current.bg,
        color: current.cl,
        border: current.bd,
        padding: small ? '5px 12px' : '9px 16px',
        borderRadius: 8,
        fontSize: small ? 12 : 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
        transition: 'opacity .1s',
        ...sx,
      }}
    >
      {children}
    </button>
  );
}

export function Inp({ value, onChange, placeholder, type = 'text', sx = {}, onKeyDown, autoFocus }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        border: `1px solid ${C.brd}`,
        background: C.bg,
        fontSize: 13,
        color: C.txt,
        outline: 'none',
        fontFamily: 'inherit',
        ...sx,
      }}
    />
  );
}

export function Modal({ title, children, onClose, width = 480 }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ background: C.bg1, borderRadius: 12, width, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 12px 48px rgba(0,0,0,.2)' }}>
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: C.txt3, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
```

## `frontend/src/features/shell/MainShell.jsx`

```jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api/base';
import { normalizeMessage, normalizeUser } from '../../shared/lib/normalizers';
import { groupMessages } from '../../shared/messages/grouping';
import { getMeetingRooms, getTextRooms, getVisibleRooms, getVoiceRooms } from '../../shared/rooms/collections';
import { TOAST_DURATION_MS, VOICE_POLL_INTERVAL_MS, WS_RECONNECT_DELAY_MS } from '../../shared/runtime/constants';
import { C } from '../../shared/ui/tokens';
import { isLiveRoom, isUserInVoice } from '../../shared/voice/helpers';
import { Sidebar } from '../sidebar/Sidebar';
import { RoomViewport } from '../rooms/RoomViewport';
import { MembersPanel } from '../members/MembersPanel';
import { VoiceOverlay } from '../overlay/VoiceOverlay';
import { CommandPalette } from '../command-palette/CommandPalette';
import { ModalsRoot } from '../modals/ModalsRoot';

export function MainShell({ user, token, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [voiceParticipants, setVoiceParticipants] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState('members');
  const [overlay, setOverlay] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [inVoice, setInVoice] = useState(false);
  const [toast, setToast] = useState(null);
  const [unread, setUnread] = useState({});
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomKind, setNewRoomKind] = useState('group');
  const [memberSearch, setMemberSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const inputRef = useRef(null);
  const messageEndRef = useRef(null);
  const wsRef = useRef(null);

  const notify = useCallback((message, type = 'info', duration = TOAST_DURATION_MS) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const openModal = (name, data = null) => {
    setModal(name);
    setModalData(data);
  };

  const closeModal = () => {
    setModal(null);
    setModalData(null);
    setNewRoomName('');
    setMemberSearch('');
  };

  useEffect(() => {
    api.rooms().then((raw) => {
      const list = getVisibleRooms(raw);
      setRooms(list);
      if (list.length) setRoom(list[0]);
    }).catch((error) => notify(`Ошибка загрузки комнат: ${error.message}`, 'error'));

    api.adminUsers().then((raw) => {
      const users = (Array.isArray(raw) ? raw : raw?.users || []).map((item) => normalizeUser(item.user || item)).filter(Boolean);
      setAllUsers(users);
    }).catch(() => null);
  }, [notify]);

  useEffect(() => {
    if (!room) return;
    setMessages([]);
    setMembers([]);
    setLoading(true);
    setVoiceParticipants([]);
    setInVoice(false);

    Promise.allSettled([
      api.messages(room.id),
      api.members(room.id),
      isLiveRoom(room) ? api.voiceState(room.id) : Promise.resolve(null),
    ]).then(([messageResult, memberResult, voiceResult]) => {
      if (messageResult.status === 'fulfilled') {
        const raw = messageResult.value;
        const list = Array.isArray(raw) ? raw : raw?.messages || raw?.data || [];
        setMessages(list.map(normalizeMessage));
      }
      if (memberResult.status === 'fulfilled') {
        const raw = memberResult.value;
        const list = Array.isArray(raw) ? raw : raw?.members || [];
        setMembers(list.map((item) => normalizeUser(item.user || item)).filter(Boolean));
      }
      if (voiceResult.status === 'fulfilled' && voiceResult.value) {
        const participants = voiceResult.value.participants || voiceResult.value.users || [];
        setVoiceParticipants(participants);
        setInVoice(isUserInVoice(participants, user?.id));
      }
      setUnread((prev) => ({ ...prev, [room.id]: 0 }));
    }).finally(() => setLoading(false));
  }, [room?.id, user?.id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token) return undefined;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    let ws;

    function connect() {
      ws = new WebSocket(`${proto}://${location.host}/ws?token=${token}`);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'message_created') {
            const message = normalizeMessage(payload.message || payload.data || payload);
            if (payload.roomId === room?.id) {
              setMessages((prev) => [...prev, message]);
            } else {
              setUnread((prev) => ({ ...prev, [payload.roomId]: (prev[payload.roomId] || 0) + 1 }));
            }
          }
          if (payload.type === 'voice_updated') {
            setVoiceParticipants(payload.participants || payload.state?.participants || []);
          }
        } catch (error) {
          return null;
        }
        return null;
      };
      ws.onclose = () => {
        if (wsRef.current === ws) setTimeout(connect, WS_RECONNECT_DELAY_MS);
      };
    }

    connect();
    wsRef.current = ws;
    return () => {
      wsRef.current = null;
      ws?.close();
    };
  }, [token, room?.id]);

  useEffect(() => {
    if (!isLiveRoom(room)) return undefined;
    const timer = setInterval(() => {
      api.voiceState(room.id).then((state) => {
        if (state) setVoiceParticipants(state.participants || []);
      }).catch(() => null);
    }, VOICE_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [room?.id, room?.kind]);

  const groupedMessages = groupMessages(messages, search);
  const textRooms = getTextRooms(rooms);
  const voiceRooms = getVoiceRooms(rooms);
  const meetingRooms = getMeetingRooms(rooms);

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, color: C.txt, overflow: 'hidden' }}>
      <Sidebar
        user={user}
        rooms={rooms}
        room={room}
        unread={unread}
        voiceParticipants={voiceParticipants}
        micOn={micOn}
        onRoomSelect={setRoom}
        onOpenModal={openModal}
        onLogout={onLogout}
        onToggleMic={() => setMicOn((value) => !value)}
      />

      <RoomViewport
        room={room}
        loading={loading}
        messages={groupedMessages}
        members={members}
        input={input}
        setInput={setInput}
        inputRef={inputRef}
        messageEndRef={messageEndRef}
        search={search}
        setSearch={setSearch}
        panel={panel}
        setPanel={setPanel}
        overlay={overlay}
        setOverlay={setOverlay}
        inVoice={inVoice}
        setInVoice={setInVoice}
        voiceParticipants={voiceParticipants}
        user={user}
        notify={notify}
        onOpenModal={openModal}
      />

      {panel === 'members' && (
        <MembersPanel
          user={user}
          members={members}
          voiceParticipants={voiceParticipants}
          onOpenModal={openModal}
          notify={notify}
        />
      )}

      {overlay && (
        <VoiceOverlay
          user={user}
          parts={voiceParticipants}
          micOn={micOn}
          onMic={() => setMicOn((value) => !value)}
          onLeave={() => {
            setInVoice(false);
            setOverlay(false);
          }}
          onClose={() => setOverlay(false)}
        />
      )}

      <CommandPalette
        open={cmdOpen}
        setOpen={setCmdOpen}
        query={cmdQuery}
        setQuery={setCmdQuery}
        rooms={rooms}
        onRoomSelect={setRoom}
        onOpenModal={openModal}
      />

      <ModalsRoot
        modal={modal}
        modalData={modalData}
        closeModal={closeModal}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        newRoomKind={newRoomKind}
        setNewRoomKind={setNewRoomKind}
        memberSearch={memberSearch}
        setMemberSearch={setMemberSearch}
        creating={creating}
        user={user}
        room={room}
        allUsers={allUsers}
        members={members}
        notify={notify}
      />
    </div>
  );
}
```
