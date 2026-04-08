import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from './lib/api';
import { authStorage } from './lib/auth';
import { bootstrapSession } from './lib/boot';
import { getSocket, resetSocket } from './lib/socket';
import { PeerMeshController } from './lib/webrtc';
import { playUiSound } from './lib/sounds';
import './styles.css';
import './signum_ai_widget.js';

const THEME_STORAGE_KEY = 'corpchat_theme';
const ShellContext = createContext(null);

function cls(...items) {
  return items.filter(Boolean).join(' ');
}

function useShellState() {
  return useContext(ShellContext);
}

function makeClientId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function roleLabel(role) {
  const labels = {
    super_admin: 'Супер-администратор',
    admin: 'Администратор',
    leader: 'Руководитель',
    moderator: 'Модератор',
    member: 'Сотрудник',
    guest: 'Приглашённый',
    external: 'Внешний участник',
    blocked: 'Заблокированный'
  };
  return labels[role] || role || 'Сотрудник';
}

function statusLabel(status) {
  const labels = {
    online: 'В сети',
    away: 'Отошёл',
    busy: 'Занят',
    offline: 'Не в сети'
  };
  return labels[status] || status || 'Не указан';
}

function roomKindLabel(kind) {
  const labels = {
    dm: 'Личный диалог',
    group: 'Текстовая комната',
    channel: 'Канал',
    voice: 'Голосовая комната',
    stage: 'Сцена',
    meeting: 'Комната для собраний'
  };
  return labels[kind] || 'Комната';
}

function roomIcon(kind) {
  if (kind === 'voice') return '🎙';
  if (kind === 'meeting') return '📋';
  if (kind === 'dm') return '✉';
  return '#';
}

function roomCounterLabel(room) {
  if (!room) return '';
  if (room.kind === 'voice' || room.kind === 'meeting') {
    return `${Number(room.connectedVoiceCount || 0)} в голосе`;
  }
  return `${Number(room.membersCount || 0)} участников`;
}


function isAnnouncementVisible(announcement, pathname, canAdmin) {
  if (!announcement?.isActive || !announcement?.title || !announcement?.message) return false;
  if (announcement.activeUntil && new Date(announcement.activeUntil).getTime() < Date.now()) return false;
  if (announcement.scope === 'all') return true;
  if (announcement.scope === 'admin') return canAdmin;
  if (announcement.scope === 'voice') return pathname.includes('/voice/');
  if (announcement.scope === 'meeting') return pathname.includes('/meetings/');
  return true;
}

const permissionMatrix = {
  super_admin: ['profile.read','profile.manage','settings.manage','rooms.read','rooms.create','rooms.archive','messages.write','messages.edit_own','messages.delete_own','messages.moderate','files.upload','files.manage','voice.join','voice.share_screen','voice.moderate','meetings.manage','admin.access','users.manage','roles.manage','audit.read','sessions.manage','system.manage'],
  admin: ['profile.read','profile.manage','settings.manage','rooms.read','rooms.create','rooms.archive','messages.write','messages.edit_own','messages.delete_own','messages.moderate','files.upload','files.manage','voice.join','voice.share_screen','voice.moderate','meetings.manage','admin.access','users.manage','roles.manage','audit.read','sessions.manage','system.manage'],
  leader: ['profile.read','settings.manage','rooms.read','rooms.create','messages.write','messages.edit_own','messages.delete_own','files.upload','voice.join','voice.share_screen','meetings.manage'],
  moderator: ['profile.read','settings.manage','rooms.read','messages.write','messages.edit_own','messages.delete_own','messages.moderate','files.upload','files.manage','voice.join','voice.share_screen','voice.moderate'],
  member: ['profile.read','settings.manage','rooms.read','messages.write','messages.edit_own','messages.delete_own','files.upload','voice.join'],
  guest: ['profile.read','rooms.read','messages.write','voice.join'],
  external: ['profile.read','rooms.read','messages.write','voice.join'],
  blocked: []
};

function hasPermission(profileOrRole, permission) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role;
  return (permissionMatrix[role] || []).includes(permission);
}

function inputValue(value) {
  return value ?? '';
}

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function initials(value) {
  const source = String(value || 'Пользователь').trim();
  return source.slice(0, 1).toUpperCase();
}

function countRoomKinds(rooms) {
  return rooms.reduce((acc, room) => {
    if (room.kind === 'voice') acc.voice += 1;
    else if (room.kind === 'meeting') acc.meeting += 1;
    else acc.chat += 1;
    return acc;
  }, { chat: 0, voice: 0, meeting: 0 });
}

function formatDayLabel(value) {
  if (!value) return 'Без даты';
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === -1) return 'Вчера';
  if (diffDays === 1) return 'Завтра';
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return String(value);
  }
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 Б';
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} КБ`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} МБ`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} ГБ`;
}

function voiceRoleLabel(role) {
  const labels = { host: 'Ведущий', moderator: 'Модератор', member: 'Участник' };
  return labels[role] || 'Участник';
}

function voiceEntryModeLabel(value) {
  if (value === 'knock') return 'Вход по запросу';
  if (value === 'closed') return 'Вход закрыт';
  return 'Свободный вход';
}

function roomOperatorActionLabel(value) {
  const labels = {
    set_entry_open: 'Свободный вход',
    set_entry_knock: 'Вход по запросу',
    set_entry_closed: 'Закрыть вход',
    mute_all: 'Отключить всем микрофоны',
    unmute_all: 'Снять mute у всех',
    lower_all_hands: 'Опустить все руки',
    stop_all_screens: 'Остановить все экраны',
    disconnect_all: 'Вывести всех из голоса'
  };
  return labels[value] || value || 'Операторское действие';
}

function meetingPresenceEventLabel(value) {
  const labels = {
    requested: 'Запрошен вход',
    approved: 'Вход одобрен',
    denied: 'Во входе отказано',
    joined: 'Вошёл в собрание',
    left: 'Вышел из собрания',
    removed: 'Удалён из собрания',
    moved_in: 'Переведён в собрание',
    moved_out: 'Переведён из собрания'
  };
  return labels[value] || value || 'Событие присутствия';
}

function incidentTypeLabel(value) {
  const labels = {
    entry_denied: 'Отказано во входе',
    voice_removed: 'Удалён из комнаты',
    voice_banned: 'Голос запрещён',
    voice_moved: 'Перемещён в другую комнату',
    disconnect_all: 'Массовое отключение всех'
  };
  return labels[value] || value || 'Инцидент';
}

function incidentSeverityLabel(value) {
  const labels = {
    low: 'Низкий приоритет',
    warning: 'Требует внимания',
    critical: 'Критично'
  };
  return labels[value] || value || 'Требует внимания';
}

function trackReadMarker(roomId, value) {
  if (!roomId) return null;
  const key = `corpchat_last_read_${roomId}`;
  if (value !== undefined) {
    window.localStorage.setItem(key, String(value || ''));
    return value;
  }
  return window.localStorage.getItem(key) || '';
}

function buildMessageTimeline(messages, lastReadAt) {
  const items = [];
  let lastDay = '';
  let unreadInserted = false;
  messages.forEach((message) => {
    const day = formatDayLabel(message.createdAt);
    if (day !== lastDay) {
      items.push({ type: 'day', key: `day-${day}-${message.id}`, label: day });
      lastDay = day;
    }
    if (!unreadInserted && lastReadAt && message.createdAt && new Date(message.createdAt).getTime() > new Date(lastReadAt).getTime()) {
      items.push({ type: 'unread', key: `unread-${message.id}` });
      unreadInserted = true;
    }
    items.push({ type: 'message', key: message.id, message });
  });
  return items;
}

function mergeVoiceMembers(baseMembers = [], voiceState = []) {
  const map = new Map(baseMembers.map((member) => [member.id, { ...member }]));
  voiceState.forEach((state) => {
    map.set(state.userId, { ...(map.get(state.userId) || {}), ...state, id: state.userId });
  });
  return Array.from(map.values()).sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''), 'ru'));
}

function deviceErrorLabel(error) {
  const name = error?.name || '';
  if (name === 'NotAllowedError') return 'Браузер не получил доступ к микрофону или экрану. Разрешите доступ в настройках вкладки.';
  if (name === 'NotFoundError') return 'Не найдено подходящее устройство. Проверьте микрофон, гарнитуру или веб-камеру.';
  if (name === 'NotReadableError') return 'Устройство занято другим приложением. Закройте сторонний софт и повторите попытку.';
  if (name === 'OverconstrainedError') return 'Выбранные параметры устройства не поддерживаются текущим браузером или системой.';
  return error?.message || 'Не удалось выполнить действие с устройством.';
}

function getRouteMeta(pathname, rooms, activeRoom) {
  const currentRoom = activeRoom || rooms.find((item) => pathname.includes(item.id));
  if (pathname.includes('/voice/')) {
    return {
      title: currentRoom?.name || 'Голосовая комната',
      subtitle: 'Голос, сотрудники, роли, статусы и подключение устройств.'
    };
  }
  if (pathname.includes('/meetings/')) {
    return {
      title: currentRoom?.name || 'Комната для собраний',
      subtitle: 'Повестка, участники, материалы и журнал событий.'
    };
  }
  if (pathname.includes('/rooms/')) {
    return {
      title: currentRoom?.name || 'Текстовая комната',
      subtitle: 'Лента сообщений, файлы, закрепы и участники.'
    };
  }
  if (pathname.includes('/sessions')) {
    return {
      title: 'Сессии и входы',
      subtitle: 'Активные устройства, история входов и завершение доступа по сессиям.'
    };
  }
  if (pathname.includes('/settings')) {
    return {
      title: 'Настройки сотрудника',
      subtitle: 'Уведомления, внешний вид, голос и специальные параметры интерфейса.'
    };
  }
  if (pathname.includes('/profile')) {
    return {
      title: 'Профиль сотрудника',
      subtitle: 'Личные данные, статус, безопасность и настройки текущей сессии.'
    };
  }
  if (pathname.includes('/admin')) {
    return {
      title: 'Центр администратора',
      subtitle: 'Пользователи, комнаты, роли, аудит и системный контур.'
    };
  }
  return {
    title: 'Рабочий контур',
    subtitle: 'Единая точка входа в комнаты, голос, собрания и администрирование.'
  };
}

function WorkspaceRail() {
  return (
    <div className="workspace-rail">
      <div className="workspace-logo">C</div>
      <div className="workspace-pill active">RU</div>
      <div className="workspace-pill">V17</div>
      <div className="workspace-spacer" />
      <div className="workspace-logo muted">ИТ</div>
    </div>
  );
}

function SidebarSection({ title, children, action }) {
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-head">
        <div className="sidebar-section-title">{title}</div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="sidebar-section-body">{children}</div>
    </section>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="button ghost" onClick={onToggle}>
      {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    </button>
  );
}

function SidebarRooms({ rooms, filter }) {
  const location = useLocation();
  const filtered = useMemo(() => {
    const value = String(filter || '').trim().toLowerCase();
    if (!value) return rooms;
    return rooms.filter((room) => `${room.name} ${roomKindLabel(room.kind)}`.toLowerCase().includes(value));
  }, [rooms, filter]);

  if (!filtered.length) {
    return <div className="notice subtle">По текущему фильтру комнаты не найдены.</div>;
  }

  return (
    <div className="channel-list">
      {filtered.map((room) => {
        const link = room.kind === 'voice'
          ? `/app/voice/${room.id}`
          : room.kind === 'meeting'
            ? `/app/meetings/${room.id}`
            : `/app/rooms/${room.id}`;

        return (
          <NavLink
            key={room.id}
            className={({ isActive }) => cls('channel-item', isActive && 'active', location.pathname.includes(room.id) && 'active')}
            to={link}
          >
            <span className="channel-prefix">{roomIcon(room.kind)}</span>
            <span className="channel-content">
              <span className="channel-name">{room.name}</span>
              <span className="channel-kind">{roomKindLabel(room.kind)} · {roomCounterLabel(room)}</span>
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}

function ShellRightPanel({ profile, activeRoom, routeMeta }) {
  const location = useLocation();
  const roomMembers = activeRoom?.members || [];

  if (location.pathname.includes('/voice/')) {
    return (
      <aside className="inspector">
        <div className="inspector-card glass stack-sm">
          <div className="eyebrow">Голосовой контур</div>
          <div className="inspector-title">{activeRoom?.name || 'Голосовая комната'}</div>
          <div className="muted">Сотрудники видны справа сразу: роль, статус и контекст модерации без переходов по отдельным экранам.</div>
        </div>

        <div className="inspector-card stack-sm">
          <div className="section-row compact">
            <strong>Участники</strong>
            <span className="pill">{roomMembers.length}</span>
          </div>
          <div className="member-list compact">
            {roomMembers.map((member) => (
              <div className="member-row" key={member.id}>
                <div className="user-avatar small">{initials(member.displayName)}</div>
                <div className="stack-xs fill">
                  <strong>{member.displayName}</strong>
                  <div className="muted small">{roleLabel(member.role)} · {member.jobTitle || 'Должность не указана'} · {member.departmentName || 'Без отдела'} · {statusLabel(member.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="inspector-card stack-sm">
          <div className="eyebrow">Модерация</div>
          <div className="meta-grid">
            <span className="meta-item">Открыть профиль</span>
            <span className="meta-item">Отключить микрофон</span>
            <span className="meta-item">Запретить голос</span>
            <span className="meta-item">Удалить из комнаты</span>
          </div>
        </div>
      </aside>
    );
  }

  if (location.pathname.includes('/meetings/')) {
    return (
      <aside className="inspector">
        <div className="inspector-card glass stack-sm">
          <div className="eyebrow">Комната для собраний</div>
          <div className="inspector-title">{activeRoom?.name || 'Собрание'}</div>
          <div className="muted">Отдельный тип комнаты. Ведущий, повестка, материалы и журнал событий живут в одном рабочем контуре.</div>
        </div>
        <div className="inspector-card stack-sm">
          <strong>Быстрый состав</strong>
          <div className="member-list compact">
            {roomMembers.map((member) => (
              <div className="member-row" key={member.id}>
                <div className="user-avatar small">{initials(member.displayName)}</div>
                <div className="stack-xs fill">
                  <strong>{member.displayName}</strong>
                  <div className="muted small">{roleLabel(member.role)} · {member.jobTitle || 'Должность не указана'} · {member.departmentName || 'Без отдела'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="inspector-card stack-sm">
          <strong>Блоки собрания</strong>
          <div className="meta-grid">
            <span className="meta-item">Повестка</span>
            <span className="meta-item">Материалы</span>
            <span className="meta-item">Итоги</span>
            <span className="meta-item">Журнал</span>
          </div>
        </div>
      </aside>
    );
  }

  if (location.pathname.includes('/rooms/')) {
    return (
      <aside className="inspector">
        <div className="inspector-card glass stack-sm">
          <div className="eyebrow">Контекст комнаты</div>
          <div className="inspector-title">{activeRoom?.name || 'Текстовая комната'}</div>
          <div className="muted">Правая панель остаётся рабочей: участники, роли и полезные ориентиры по текущей комнате.</div>
        </div>
        <div className="inspector-card stack-sm">
          <div className="section-row compact">
            <strong>Участники</strong>
            <span className="pill">{roomMembers.length}</span>
          </div>
          <div className="member-list compact">
            {roomMembers.map((member) => (
              <div className="member-row" key={member.id}>
                <div className="user-avatar small">{initials(member.displayName)}</div>
                <div className="stack-xs fill">
                  <strong>{member.displayName}</strong>
                  <div className="muted small">{roleLabel(member.role)} · {member.jobTitle || 'Должность не указана'} · {member.departmentName || 'Без отдела'} · {statusLabel(member.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="inspector-card stack-sm">
          <div className="eyebrow">Тип комнаты</div>
          <div className="meta-grid">
            <span className="meta-item">{roomKindLabel(activeRoom?.kind)}</span>
            <span className="meta-item">Русский интерфейс</span>
            <span className="meta-item">Shell без пустых блоков</span>
          </div>
        </div>
      </aside>
    );
  }

  if (location.pathname.includes('/admin')) {
    return (
      <aside className="inspector">
        <div className="inspector-card glass stack-sm">
          <div className="eyebrow">Центр администратора</div>
          <div className="inspector-title">Единая точка управления</div>
          <div className="muted">Пользователи, комнаты, роли, аудит и системный контур готовятся внутри одного центра без распада на отдельные мини-панели.</div>
        </div>
        <div className="inspector-card stack-sm">
          <strong>Модули</strong>
          <div className="meta-grid">
            <span className="meta-item">Пользователи</span>
            <span className="meta-item">Комнаты</span>
            <span className="meta-item">Роли и права</span>
            <span className="meta-item">Аудит</span>
            <span className="meta-item">Система</span>
          </div>
        </div>
      </aside>
    );
  }

  if (location.pathname.includes('/settings')) {
    return (
      <aside className="inspector">
        <div className="inspector-card glass stack-sm">
          <div className="eyebrow">Настройки сотрудника</div>
          <div className="inspector-title">Персональный контур</div>
          <div className="muted">Отдельные блоки для уведомлений, внешнего вида, голоса и специальных параметров интерфейса.</div>
        </div>
        <div className="inspector-card stack-sm">
          <strong>Активные параметры</strong>
          <div className="meta-grid">
            <span className="meta-item">Тема: {profile?.settings?.theme === 'light' ? 'светлая' : 'тёмная'}</span>
            <span className="meta-item">Уведомления: {profile?.settings?.notificationsEnabled ? 'включены' : 'отключены'}</span>
            <span className="meta-item">Голос: {profile?.settings?.pushToTalk ? 'Push-to-talk' : 'обычный режим'}</span>
          </div>
        </div>
      </aside>
    );
  }

  if (location.pathname.includes('/profile')) {
    return (
      <aside className="inspector">
        <div className="inspector-card glass stack-sm">
          <div className="eyebrow">Сотрудник</div>
          <div className="inspector-title">{profile?.displayName || profile?.email || 'Профиль'}</div>
          <div className="muted">Отдельный модуль профиля: роль, отдел, безопасность и список доступных комнат.</div>
        </div>
        <div className="inspector-card stack-sm">
          <strong>Текущее состояние</strong>
          <div className="meta-grid">
            <span className="meta-item">{roleLabel(profile?.role)}</span>
            <span className="meta-item">{statusLabel(profile?.status)}</span>
            <span className="meta-item">{profile?.departmentName || 'Отдел не указан'}</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector">
      <div className="inspector-card glass stack-sm">
        <div className="eyebrow">Release discipline / русский shell</div>
        <div className="inspector-title">{routeMeta.title}</div>
        <div className="muted">Один baseline, один deploy path, русская оболочка и плотный рабочий shell без хаоса параллельных редакций.</div>
      </div>
      <div className="inspector-card stack-sm">
        <strong>Контрольные признаки</strong>
        <div className="meta-grid">
          <span className="meta-item">Русский интерфейс</span>
          <span className="meta-item">Тёмная тема по умолчанию</span>
          <span className="meta-item">Светлая тема как опция</span>
          <span className="meta-item">Правый контекстный блок</span>
        </div>
      </div>
    </aside>
  );
}

function AppShell({ profile, onLogout, theme, setTheme, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [notices, setNotices] = useState([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [activeSummons, setActiveSummons] = useState([]);
  const [releaseInfo, setReleaseInfo] = useState({ releaseVersion: '17.14.0', releaseChannel: 'launch-board' });
  const [runtimeAnnouncement, setRuntimeAnnouncement] = useState(profile?.system?.announcement || null);
  const [runtimeStatus, setRuntimeStatus] = useState({ api: 'unknown', socket: 'offline', network: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online' });
  const activeRoomRef = useRef(null);

  useEffect(() => {
    api.rooms().then(setRooms).catch(() => setRooms([]));
  }, []);

  const roomIdMatch = location.pathname.match(/\/app\/(?:rooms|voice|meetings)\/([^/]+)/);
  const activeRoomId = roomIdMatch?.[1] || null;

  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoom(null);
      return;
    }
    api.room(activeRoomId).then(setActiveRoom).catch(() => setActiveRoom(null));
  }, [activeRoomId]);

  const roomCounts = useMemo(() => countRoomKinds(rooms), [rooms]);
  const routeMeta = useMemo(() => getRouteMeta(location.pathname, rooms, activeRoom), [location.pathname, rooms, activeRoom]);
  const canAdmin = hasPermission(profile, 'admin.access');
  const systemBranding = profile?.system || {};
  const liveSettings = profile?.settings || {};

  useEffect(() => {
    setRuntimeAnnouncement(profile?.system?.announcement || null);
  }, [profile?.system]);

  useEffect(() => {
    if (!liveSettings.desktopNotifications || !('Notification' in window) || Notification.permission !== 'default') return;
    const timer = window.setTimeout(() => {
      Notification.requestPermission().catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [liveSettings.desktopNotifications]);

  async function refreshRoomsSafe() {
    try {
      setRooms(await api.rooms());
    } catch {
      setRooms([]);
    }
  }

  function notify({ title, message, tone = 'message', sticky = false }) {
    const item = { id: makeClientId(), title, message, sticky, createdAt: new Date().toISOString() };
    setNotices((current) => [item, ...current].slice(0, 12));
    if (liveSettings.soundEnabled) playUiSound(tone, true);
    if (liveSettings.desktopNotifications && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message });
      } catch {}
    }
  }

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const socket = await getSocket();
      if (disposed) return;
      socket.connect();

      const onPresence = ({ userId, status }) => {
        setActiveRoom((current) => {
          if (!current?.members?.length) return current;
          const members = current.members.map((member) => member.id === userId ? { ...member, status: status === 'online' ? 'online' : 'offline' } : member);
          return { ...current, members };
        });
      };

      const onVoiceModeration = (payload) => {
        if (!payload) return;
        if (payload.roomId && payload.roomId === activeRoomRef.current) {
          api.room(payload.roomId).then(setActiveRoom).catch(() => undefined);
        }
        if (payload.action) {
          notify({
            title: 'Голосовой контур обновлён',
            message: `Сработало действие модерации: ${payload.action}.`,
            tone: payload.action === 'move_to_room' ? 'join' : 'alert'
          });
        }
      };

      const onVoiceSummon = (payload) => {
        if (!payload?.roomId) return;
        setActiveSummons((current) => [{ ...payload, id: makeClientId() }, ...current].slice(0, 6));
        notify({
          title: 'Вас вызывают в комнату',
          message: `${payload.actorDisplayName || 'Модератор'} приглашает в «${payload.roomName || 'комнату'}».`,
          tone: 'join',
          sticky: true
        });
      };

      const onSystemAnnouncement = (payload) => {
        setRuntimeAnnouncement(payload || null);
        if (payload?.isActive) {
          notify({ title: payload.title || 'Системное объявление', message: payload.message || 'Опубликовано новое системное объявление.', tone: payload.level === 'danger' ? 'alert' : 'message', sticky: true });
        }
      };

      const onVoiceRequestStatus = (payload) => {
        if (!payload?.roomId) return;
        notify({
          title: payload.status === 'approved' ? 'Запрос на вход одобрен' : 'Запрос на вход отклонён',
          message: payload.status === 'approved'
            ? `Теперь можно входить в голосовой контур комнаты «${payload.roomName || 'Комната'}».`
            : `Ведущий или модератор отклонил вход в комнату «${payload.roomName || 'Комната'}».`,
          tone: payload.status === 'approved' ? 'join' : 'alert',
          sticky: true
        });
      };

      const onVoiceAccess = (payload) => {
        if (!payload?.roomId) return;
        if (payload.roomId === activeRoomRef.current) {
          api.room(payload.roomId).then(setActiveRoom).catch(() => undefined);
        }
        refreshRoomsSafe();
      };

      socket.on('presence:update', onPresence);
      socket.on('voice:moderation', onVoiceModeration);
      socket.on('voice:summon', onVoiceSummon);
      socket.on('voice:request-status', onVoiceRequestStatus);
      socket.on('voice:access', onVoiceAccess);
      socket.on('system:announcement', onSystemAnnouncement);

      cleanup = () => {
        socket.off('presence:update', onPresence);
        socket.off('voice:moderation', onVoiceModeration);
        socket.off('voice:summon', onVoiceSummon);
        socket.off('voice:request-status', onVoiceRequestStatus);
        socket.off('voice:access', onVoiceAccess);
        socket.off('system:announcement', onSystemAnnouncement);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [liveSettings.soundEnabled, liveSettings.desktopNotifications]);

  useEffect(() => {
    if (!notices.length) return;
    const timer = window.setTimeout(() => {
      setNotices((current) => current.filter((item, index) => index === 0 ? item.sticky : true).slice(0, 12));
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [notices]);

  function openPrimaryRoom(kind) {
    const room = rooms.find((item) => item.kind === kind) || rooms[0];
    if (!room) return;
    if (room.kind === 'voice') navigate(`/app/voice/${room.id}`);
    else if (room.kind === 'meeting') navigate(`/app/meetings/${room.id}`);
    else navigate(`/app/rooms/${room.id}`);
  }

  useEffect(() => {
    let mounted = true;
    api.release().then((payload) => {
      if (!mounted) return;
      setReleaseInfo(payload || {});
      setRuntimeStatus((current) => ({ ...current, api: 'online' }));
    }).catch(() => {
      if (!mounted) return;
      setRuntimeStatus((current) => ({ ...current, api: 'degraded' }));
    });

    const timer = window.setInterval(() => {
      api.health().then(() => {
        if (!mounted) return;
        setRuntimeStatus((current) => ({ ...current, api: 'online' }));
      }).catch(() => {
        if (!mounted) return;
        setRuntimeStatus((current) => ({ ...current, api: 'degraded' }));
      });
    }, 15000);

    const setOnline = () => setRuntimeStatus((current) => ({ ...current, network: 'online' }));
    const setOffline = () => setRuntimeStatus((current) => ({ ...current, network: 'offline' }));
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    getSocket().then((socket) => {
      const handleConnect = () => setRuntimeStatus((current) => ({ ...current, socket: 'online' }));
      const handleDisconnect = () => setRuntimeStatus((current) => ({ ...current, socket: 'offline' }));
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      if (socket.connected) handleConnect();
      else socket.connect();
    }).catch(() => {
      if (!mounted) return;
      setRuntimeStatus((current) => ({ ...current, socket: 'offline' }));
    });

    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  useEffect(() => {
    document.title = `${systemBranding.appName || 'Контур Связи'} · ${releaseInfo.releaseVersion || '17.10.0'}`;
  }, [systemBranding.appName, releaseInfo.releaseVersion]);

  const shellValue = useMemo(() => ({
    rooms,
    setRooms,
    activeRoom,
    setActiveRoom,
    search,
    setSearch,
    roomCounts,
    canAdmin,
    notify,
    refreshRooms: refreshRoomsSafe
  }), [rooms, activeRoom, search, roomCounts, canAdmin, liveSettings.soundEnabled, liveSettings.desktopNotifications]);

  return (
    <ShellContext.Provider value={shellValue}>
      <div className="layout">
        <WorkspaceRail />

        <aside className="sidebar">
          <div className="brand-block">
            <div>
              <div className="eyebrow">Корпоративный контур связи и координации</div>
              <h1 className="brand-title">{systemBranding.appName || 'CorpChat'}</h1>
            </div>
            <div className="brand-subtitle">{systemBranding.footerMark || 'Плотный рабочий shell для сообщений, файлов, голоса, собраний и административного центра в российском контуре.'}</div>
            <div className="meta-grid wide">
              <span className="meta-item">Организация: {systemBranding.organizationName || 'IT Group Company'}</span>
              {systemBranding.organizationInn ? <span className="meta-item">ИНН: {systemBranding.organizationInn}</span> : null}
              <span className="meta-item">Пакет: {systemBranding.licensePlan || '15 пользователей'}</span>
              <span className="meta-item">Релиз: {releaseInfo.releaseVersion || systemBranding.releaseLabel || '17.17.0 operator-wallboard'}</span>
              <span className="meta-item">Ответственный: {profile?.displayName || 'Администратор'}</span>
            </div>
          </div>

          <div className="search-shell input-wrap">
            <span>⌕</span>
            <input
              className="search-input"
              placeholder="Поиск по комнатам и разделам"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <SidebarSection title="Навигация">
            <nav className="nav-stack">
              <NavLink to="/app/inbox" className={({ isActive }) => cls('nav-item', isActive && 'active')}>
                <span>🏠</span><span>Главная</span>
              </NavLink>
              <button className="nav-item button-reset" onClick={() => openPrimaryRoom('group')}>
                <span>💬</span><span>Текстовые комнаты</span>
              </button>
              <button className="nav-item button-reset" onClick={() => openPrimaryRoom('voice')}>
                <span>🎙</span><span>Голосовые комнаты</span>
              </button>
              <button className="nav-item button-reset" onClick={() => openPrimaryRoom('meeting')}>
                <span>📋</span><span>Собрания</span>
              </button>
              <NavLink to="/app/profile" className={({ isActive }) => cls('nav-item', isActive && 'active')}>
                <span>👤</span><span>Профиль</span>
              </NavLink>
              <NavLink to="/app/settings" className={({ isActive }) => cls('nav-item', isActive && 'active')}>
                <span>⚙️</span><span>Настройки</span>
              </NavLink>
              <NavLink to="/app/sessions" className={({ isActive }) => cls('nav-item', isActive && 'active')}>
                <span>🔐</span><span>Сессии и входы</span>
              </NavLink>
              {canAdmin ? (
                <NavLink to="/app/admin" className={({ isActive }) => cls('nav-item', isActive && 'active')}>
                  <span>🛡</span><span>Центр администратора</span>
                </NavLink>
              ) : null}
            </nav>
          </SidebarSection>

          <SidebarSection title="Комнаты" action={<span className="pill">{rooms.length}</span>}>
            <SidebarRooms rooms={rooms} filter={search} />
          </SidebarSection>

          <div className="sidebar-meta-grid">
            <div className="mini-stat">
              <span>Текст</span>
              <strong>{roomCounts.chat}</strong>
            </div>
            <div className="mini-stat">
              <span>Голос</span>
              <strong>{roomCounts.voice}</strong>
            </div>
            <div className="mini-stat">
              <span>Собрания</span>
              <strong>{roomCounts.meeting}</strong>
            </div>
          </div>

          <div className="user-card glass">
            <div className="user-avatar">{initials(profile?.displayName || profile?.email)}</div>
            <div className="user-meta">
              <div className="user-name">{profile?.displayName || 'Сотрудник'}</div>
              <div className="user-role">{roleLabel(profile?.role)} · {statusLabel(profile?.status)}</div>
            </div>
            <div className="user-actions">
              <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
              <button className="button ghost danger-text" onClick={onLogout}>Выйти</button>
            </div>
          </div>
        </aside>

        <section className="surface">
          <header className="topbar">
            <div>
              <div className="eyebrow">{routeMeta.subtitle}</div>
              <div className="topbar-title">{routeMeta.title}</div>
              <div className="muted small">Организация работает в одном лицензируемом контуре без публичной хаотичной регистрации.</div>
            </div>
            <div className="topbar-actions">
              <div className="topbar-search input-wrap">
                <span>⌕</span>
                <input
                  className="search-input"
                  placeholder="Быстрый фильтр shell"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="topbar-pills">
                <span className="pill pill-accent">Русский UI</span>
                <span className="pill">Один baseline</span>
                <span className="pill">Тема: {theme === 'dark' ? 'тёмная' : 'светлая'}</span>
                <span className={cls('pill', runtimeStatus.api === 'online' ? 'pill-success' : 'pill-warn')}>API: {runtimeStatus.api === 'online' ? 'в норме' : 'проверить'}</span>
                <span className={cls('pill', runtimeStatus.socket === 'online' ? 'pill-success' : 'pill-warn')}>Сокет: {runtimeStatus.socket === 'online' ? 'подключён' : 'не подключён'}</span>
                <span className={cls('pill', runtimeStatus.network === 'online' ? '' : 'pill-warn')}>Сеть: {runtimeStatus.network === 'online' ? 'онлайн' : 'офлайн'}</span>
                <button className="pill notification-pill" onClick={() => setNoticeOpen((value) => !value)}>Уведомления {notices.length ? `· ${notices.length}` : ''}</button>
              </div>
            </div>
            {noticeOpen ? (
              <div className="notification-drawer card elevated stack-sm">
                <div className="section-row compact">
                  <strong>Живая активность</strong>
                  <button className="button ghost small" onClick={() => setNotices([])}>Очистить</button>
                </div>
                <div className="list-rail">
                  {notices.length ? notices.map((item) => (
                    <div key={item.id} className="mini-item">
                      <strong>{item.title}</strong>
                      <span className="muted small">{item.message}</span>
                      <span className="muted small">{formatDateTime(item.createdAt)}</span>
                    </div>
                  )) : <div className="muted small">Новых событий пока нет.</div>}
                </div>
              </div>
            ) : null}
          </header>

          <main className="content-area">
            {isAnnouncementVisible(runtimeAnnouncement, location.pathname, canAdmin) ? (
              <section className={cls('card elevated announcement-banner', `announcement-${runtimeAnnouncement?.level || 'info'}`)}>
                <div className="stack-xs fill">
                  <div className="section-row compact">
                    <strong>{runtimeAnnouncement?.title || 'Системное объявление'}</strong>
                    <span className="pill">{runtimeAnnouncement?.scope === 'all' ? 'Для всех' : runtimeAnnouncement?.scope === 'admin' ? 'Только админы' : runtimeAnnouncement?.scope === 'voice' ? 'Голосовой контур' : 'Собрания'}</span>
                  </div>
                  <div className="muted">{runtimeAnnouncement?.message}</div>
                  {runtimeAnnouncement?.activeUntil ? <div className="muted small">Действует до: {formatDateTime(runtimeAnnouncement.activeUntil)}</div> : null}
                </div>
              </section>
            ) : null}
            {activeSummons.length ? (
              <section className="card elevated summon-banner stack-sm">
                <div className="section-row compact">
                  <strong>Быстрые вызовы в комнаты</strong>
                  <button className="button ghost small" onClick={() => setActiveSummons([])}>Очистить</button>
                </div>
                <div className="list-rail">
                  {activeSummons.map((item) => (
                    <div key={item.id} className="mini-item summon-item">
                      <strong>{item.roomName || 'Комната'}</strong>
                      <span className="muted small">{item.actorDisplayName || 'Модератор'} вызывает вас {item.roomKind === 'meeting' ? 'на собрание' : 'в голосовую комнату'}.</span>
                      {item.note ? <span className="muted small">Комментарий: {item.note}</span> : null}
                      <div className="row wrap">
                        <button className="button primary small" onClick={() => {
                          if (item.roomKind === 'meeting') navigate(`/app/meetings/${item.roomId}`);
                          else navigate(`/app/voice/${item.roomId}`);
                          setActiveSummons((current) => current.filter((entry) => entry.id !== item.id));
                        }}>Открыть комнату</button>
                        <button className="button ghost small" onClick={() => setActiveSummons((current) => current.filter((entry) => entry.id !== item.id))}>Скрыть</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {children}
          </main>
        </section>

        <ShellRightPanel profile={profile} activeRoom={activeRoom} routeMeta={routeMeta} />
      </div>
    </ShellContext.Provider>
  );
}

function extractError(error, fallback = 'Не удалось выполнить действие.') {
  return error?.message || error?.title || fallback;
}

function sessionDeviceLabel(session) {
  if (!session?.userAgent) return 'Устройство без сигнатуры';
  return session.userAgent;
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ login: 'admin@corpchat.local', password: 'admin123', busy: false, error: '' });

  async function submit() {
    setState((current) => ({ ...current, busy: true, error: '' }));
    try {
      const result = await api.login(state.login, state.password);
      authStorage.setSession(result);
      onLogin(result.user);
      navigate('/app/inbox');
    } catch (error) {
      setState((current) => ({ ...current, error: extractError(error, 'Не удалось выполнить вход.') }));
    } finally {
      setState((current) => ({ ...current, busy: false }));
    }
  }

  return (
    <div className="login-layout">
      <div className="login-hero glass">
        <div className="eyebrow">Внутренний защищённый контур</div>
        <h1 className="login-title">Современный корпоративный мессенджер без англоязычных хвостов и пустых экранов.</h1>
        <div className="login-copy">Один baseline, один deploy path, плотный App Shell и единый путь к комнатам, голосу, собраниям и административному центру.</div>
        <div className="hero-grid">
          <div className="feature-card"><strong>Комнаты</strong><span>Текстовые, голосовые и отдельные комнаты для собраний.</span></div>
          <div className="feature-card"><strong>Доступ</strong><span>Вход, восстановление, приглашения и контроль сессий.</span></div>
          <div className="feature-card"><strong>Файлы</strong><span>Загрузка и доступ в рамках комнаты.</span></div>
          <div className="feature-card"><strong>Аудит</strong><span>Журнал действий для корпоративного контура.</span></div>
        </div>
      </div>

      <div className="login-panel card elevated stack">
        <div>
          <div className="eyebrow">Авторизация</div>
          <h2 className="panel-title">Войти в Контур Связи</h2>
          <div className="muted">Для стенда логин и пароль уже предзаполнены.</div>
        </div>

        <label className="field">
          <span>Логин или рабочая почта</span>
          <input className="input" value={state.login} onChange={(e) => setState({ ...state, login: e.target.value })} />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input className="input" type="password" value={state.password} onChange={(e) => setState({ ...state, password: e.target.value })} />
        </label>

        {state.error ? <div className="notice danger">{state.error}</div> : <div className="notice success">Работают вход, восстановление доступа, приглашения и управление сессиями.</div>}

        <button className="button primary large" disabled={state.busy} onClick={submit}>
          {state.busy ? 'Выполняется вход...' : 'Войти'}
        </button>

        <div className="row spread wrap small-links">
          <NavLink to="/forgot-password" className="text-link">Забыли пароль?</NavLink>
          <NavLink to="/invite" className="text-link">Вход по приглашению</NavLink>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [state, setState] = useState({ email: 'admin@corpchat.local', busy: false, error: '', result: null });

  async function submit() {
    setState((current) => ({ ...current, busy: true, error: '', result: null }));
    try {
      const result = await api.forgotPassword(state.email);
      setState((current) => ({ ...current, result }));
    } catch (error) {
      setState((current) => ({ ...current, error: extractError(error, 'Не удалось создать запрос на восстановление.') }));
    } finally {
      setState((current) => ({ ...current, busy: false }));
    }
  }

  return (
    <div className="standalone-layout">
      <section className="card elevated stack-lg standalone-card">
        <div>
          <div className="eyebrow">Восстановление доступа</div>
          <h1 className="section-title">Забыли пароль?</h1>
          <div className="muted">Введите рабочую почту. Для стенда ссылка восстановления возвращается сразу, пока внешний почтовый шлюз не подключён.</div>
        </div>

        <label className="field">
          <span>Рабочая почта</span>
          <input className="input" type="email" value={state.email} onChange={(e) => setState({ ...state, email: e.target.value })} />
        </label>

        {state.error ? <div className="notice danger">{state.error}</div> : null}
        {state.result ? (
          <div className="card elevated stack-sm">
            <div className="notice success">Запрос создан. Код действует {state.result.expiresInMinutes || 30} минут.</div>
            {state.result.resetToken ? <div className="monospace">Служебный код стенда: {state.result.resetToken}</div> : null}
            {state.result.resetPath ? <div className="muted">Ссылка для перехода: {window.location.origin}{state.result.resetPath}</div> : null}
            <div className="row wrap">
              {state.result.resetToken ? <button className="button primary" onClick={() => navigate(`/reset-password?token=${encodeURIComponent(state.result.resetToken)}`)}>Перейти к установке нового пароля</button> : null}
              <button className="button ghost" onClick={() => navigate('/')}>Вернуться ко входу</button>
            </div>
          </div>
        ) : null}

        <div className="row wrap">
          <button className="button primary" disabled={state.busy} onClick={submit}>{state.busy ? 'Создаём запрос...' : 'Отправить код или ссылку'}</button>
          <button className="button ghost" onClick={() => navigate('/')}>Назад</button>
        </div>
      </section>
    </div>
  );
}

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryToken = new URLSearchParams(location.search).get('token') || '';
  const [state, setState] = useState({ token: queryToken, newPassword: '', confirmPassword: '', busy: false, error: '', success: '' });

  async function submit() {
    setState((current) => ({ ...current, busy: true, error: '', success: '' }));
    try {
      await api.resetPassword(state.token, state.newPassword, state.confirmPassword);
      setState((current) => ({ ...current, success: 'Пароль обновлён. Теперь можно выполнить вход с новым паролем.' }));
    } catch (error) {
      setState((current) => ({ ...current, error: extractError(error, 'Не удалось обновить пароль.') }));
    } finally {
      setState((current) => ({ ...current, busy: false }));
    }
  }

  return (
    <div className="standalone-layout">
      <section className="card elevated stack-lg standalone-card">
        <div>
          <div className="eyebrow">Новый пароль</div>
          <h1 className="section-title">Установка нового пароля</h1>
          <div className="muted">Используйте код восстановления или служебную ссылку из предыдущего шага.</div>
        </div>

        <label className="field">
          <span>Код восстановления</span>
          <input className="input monospace" value={state.token} onChange={(e) => setState({ ...state, token: e.target.value })} />
        </label>
        <label className="field">
          <span>Новый пароль</span>
          <input className="input" type="password" value={state.newPassword} onChange={(e) => setState({ ...state, newPassword: e.target.value })} />
        </label>
        <label className="field">
          <span>Подтверждение нового пароля</span>
          <input className="input" type="password" value={state.confirmPassword} onChange={(e) => setState({ ...state, confirmPassword: e.target.value })} />
        </label>

        {state.error ? <div className="notice danger">{state.error}</div> : null}
        {state.success ? <div className="notice success">{state.success}</div> : null}

        <div className="row wrap">
          <button className="button primary" disabled={state.busy} onClick={submit}>{state.busy ? 'Обновляем пароль...' : 'Сохранить новый пароль'}</button>
          <button className="button ghost" onClick={() => navigate('/')}>Вернуться ко входу</button>
        </div>
      </section>
    </div>
  );
}

function InviteAcceptPage({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tokenFromQuery = new URLSearchParams(location.search).get('token') || '';
  const [state, setState] = useState({
    token: tokenFromQuery,
    busy: false,
    previewBusy: false,
    error: '',
    preview: null,
    displayName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!tokenFromQuery) return;
    previewInvitation(tokenFromQuery);
  }, [tokenFromQuery]);

  async function previewInvitation(explicitToken) {
    const token = explicitToken || state.token;
    if (!token) {
      setState((current) => ({ ...current, error: 'Укажите токен приглашения или откройте ссылку, которую прислал администратор.' }));
      return;
    }

    setState((current) => ({ ...current, previewBusy: true, error: '' }));
    try {
      const preview = await api.invitePreview(token);
      setState((current) => ({ ...current, preview, token }));
    } catch (error) {
      setState((current) => ({ ...current, error: extractError(error, 'Не удалось проверить приглашение.'), preview: null }));
    } finally {
      setState((current) => ({ ...current, previewBusy: false }));
    }
  }

  async function acceptInvitation() {
    setState((current) => ({ ...current, busy: true, error: '' }));
    try {
      const result = await api.acceptInvite({
        token: state.token,
        displayName: state.displayName,
        username: state.username,
        password: state.password,
        confirmPassword: state.confirmPassword
      });
      authStorage.setSession(result);
      onLogin(result.user);
      navigate('/app/inbox');
    } catch (error) {
      setState((current) => ({ ...current, error: extractError(error, 'Не удалось принять приглашение.') }));
    } finally {
      setState((current) => ({ ...current, busy: false }));
    }
  }

  return (
    <div className="standalone-layout">
      <section className="card elevated stack-lg standalone-card">
        <div>
          <div className="eyebrow">Корпоративное приглашение</div>
          <h1 className="section-title">Первый вход по приглашению</h1>
          <div className="muted">Публичная хаотичная регистрация не используется. Учётная запись открывается только по приглашению администратора.</div>
        </div>

        <label className="field">
          <span>Токен приглашения</span>
          <input className="input monospace" value={state.token} onChange={(e) => setState({ ...state, token: e.target.value })} placeholder="Вставьте ссылку или код приглашения" />
        </label>
        <div className="row wrap">
          <button className="button ghost" disabled={state.previewBusy} onClick={() => previewInvitation()}>{state.previewBusy ? 'Проверяем...' : 'Проверить приглашение'}</button>
          <span className="muted small">Демонстрационный код для пакета: invite_demo_stage2_2026</span>
        </div>

        {state.error ? <div className="notice danger">{state.error}</div> : null}
        {state.preview ? (
          <div className="card elevated stack-sm">
            <div className="notice success">Приглашение действительно до {formatDateTime(state.preview.expiresAt)}.</div>
            <div className="feature-list compact-list">
              <div className="feature-row"><strong>Почта:</strong><span>{state.preview.email}</span></div>
              <div className="feature-row"><strong>Роль:</strong><span>{roleLabel(state.preview.role)}</span></div>
              {state.preview.note ? <div className="feature-row"><strong>Комментарий:</strong><span>{state.preview.note}</span></div> : null}
            </div>
          </div>
        ) : null}

        <label className="field">
          <span>ФИО сотрудника</span>
          <input className="input" value={state.displayName} onChange={(e) => setState({ ...state, displayName: e.target.value })} />
        </label>
        <label className="field">
          <span>Корпоративный логин</span>
          <input className="input" value={state.username} onChange={(e) => setState({ ...state, username: e.target.value })} />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input className="input" type="password" value={state.password} onChange={(e) => setState({ ...state, password: e.target.value })} />
        </label>
        <label className="field">
          <span>Подтверждение пароля</span>
          <input className="input" type="password" value={state.confirmPassword} onChange={(e) => setState({ ...state, confirmPassword: e.target.value })} />
        </label>

        <div className="row wrap">
          <button className="button primary" disabled={state.busy} onClick={acceptInvitation}>{state.busy ? 'Создаём учётную запись...' : 'Принять приглашение и войти'}</button>
          <button className="button ghost" onClick={() => navigate('/')}>Вернуться ко входу</button>
        </div>
      </section>
    </div>
  );
}

function SessionsPage({ onLogout }) {
  const [payload, setPayload] = useState({ currentSessionId: authStorage.getSessionId(), sessions: [], history: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setPayload(await api.sessions());
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить список сессий.'));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function revokeSession(sessionId, isCurrent) {
    setBusy(true);
    setError('');
    try {
      await api.revokeSession(sessionId);
      if (isCurrent) {
        await onLogout();
        return;
      }
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось завершить сессию.'));
    } finally {
      setBusy(false);
    }
  }

  async function logoutOthers() {
    setBusy(true);
    setError('');
    try {
      await api.logoutAll(true);
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось завершить другие сессии.'));
    } finally {
      setBusy(false);
    }
  }

  async function logoutAllEverywhere() {
    setBusy(true);
    setError('');
    try {
      await api.logoutAll(false);
      await onLogout();
    } catch (err) {
      setError(extractError(err, 'Не удалось завершить все сессии.'));
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner glass">
        <div>
          <div className="eyebrow">Сессии и журнал входов</div>
          <h2 className="section-title">Контроль устройств и активных входов</h2>
          <div className="muted">Этап 2 закрывает корпоративный контур доступа: вход, восстановление, приглашения, активные сессии и выход со всех устройств.</div>
        </div>
        <div className="stats-grid three">
          <StatCard label="Активные сессии" value={payload.sessions.filter((item) => !item.isRevoked && !item.isExpired).length} subtext="Текущие устройства" accent={true} />
          <StatCard label="Журнал входов" value={payload.history.length} subtext="Последние auth-события" />
          <StatCard label="Текущая сессия" value={payload.currentSessionId ? 'Есть' : '—'} subtext="Отмечается отдельно" />
        </div>
      </section>

      {error ? <div className="notice danger">{error}</div> : null}

      {canManage ? (
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Быстрые действия ведущего</strong><span className="pill pill-accent">Launch control</span></div>
          <div className="row wrap">
            <button className="button primary" disabled={busy || form.status === 'active'} onClick={() => runMeetingAction('open_meeting', 'Собрание открыто ведущим через быстрые действия.')}>Открыть собрание</button>
            <button className="button ghost" disabled={busy || form.status === 'closed'} onClick={() => runMeetingAction('close_meeting', form.summary || 'Собрание завершено ведущим через быстрые действия.')}>Завершить собрание</button>
            <button className="button ghost" disabled={busy} onClick={() => runMeetingAction('mute_all', 'Всем участникам отключены микрофоны ведущим.')}>Отключить всем микрофоны</button>
            <button className="button ghost" disabled={busy} onClick={() => runMeetingAction('lower_all_hands', 'Поднятые руки сброшены ведущим.')}>Сбросить все руки</button>
            <button className="button ghost" disabled={busy} onClick={() => runMeetingAction('stop_all_screens', 'Все демонстрации экрана остановлены ведущим.')}>Остановить все экраны</button>
          </div>
          <div className="section-row compact"><strong>Массовый вызов отсутствующих</strong><span className="pill">Вне голоса: {missingParticipants.length}</span></div>
          <input className="input" placeholder="Комментарий к вызову на собрание" value={summonNote} onChange={(e) => setSummonNote(e.target.value)} />
          <button className="button primary" disabled={busy || !missingParticipants.length} onClick={summonMissingParticipants}>Вызвать всех отсутствующих</button>
        </section>
      ) : null}

      <section className="card elevated stack">
        <div className="section-row compact">
          <strong>Действия доступа</strong>
          <span className="pill">Этап 2</span>
        </div>
        <div className="row wrap">
          <button className="button ghost" disabled={busy} onClick={logoutOthers}>Завершить другие сессии</button>
          <button className="button primary" disabled={busy} onClick={logoutAllEverywhere}>Выйти со всех устройств</button>
        </div>
      </section>

      <section className="card elevated stack">
        <div className="section-row compact">
          <strong>Активные устройства</strong>
          <span className="pill">{payload.sessions.length}</span>
        </div>
        <div className="feature-list">
          {payload.sessions.length ? payload.sessions.map((session) => (
            <div className="feature-row" key={session.id}>
              <div className="stack-xs fill">
                <strong>{sessionDeviceLabel(session)}</strong>
                <div className="muted small">IP: {session.ipAddress || '—'} · Создана: {formatDateTime(session.createdAt)} · Истекает: {formatDateTime(session.expiresAt)}</div>
              </div>
              <div className="row wrap align-center">
                {session.isCurrent ? <span className="pill pill-accent">Текущая</span> : null}
                {session.isRevoked ? <span className="pill pill-danger">Завершена</span> : null}
                {session.isExpired ? <span className="pill">Истекла</span> : null}
                {!session.isRevoked && !session.isExpired ? <button className="button ghost" disabled={busy} onClick={() => revokeSession(session.id, session.isCurrent)}>Завершить</button> : null}
              </div>
            </div>
          )) : <div className="empty-state card">Активные сессии не найдены.</div>}
        </div>
      </section>

      <section className="card elevated stack">
        <div className="section-row compact">
          <strong>История входов</strong>
          <span className="pill">Auth</span>
        </div>
        <div className="audit-list">
          {payload.history.length ? payload.history.map((item) => (
            <div className="audit-row card elevated" key={item.id}>
              <div className="audit-main">
                <strong>{item.action}</strong>
                <div className="muted">{item.target || 'Без цели'}</div>
              </div>
              <div className="audit-result">{item.result}</div>
              <div className="muted small">{formatDateTime(item.createdAt)}</div>
              {item.meta ? <pre className="audit-meta monospace pre-wrap">{JSON.stringify(item.meta, null, 2)}</pre> : null}
            </div>
          )) : <div className="empty-state card">Журнал входов пока пуст.</div>}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, subtext, accent = false }) {
  return (
    <div className={cls('stat-card card', accent && 'accent-card')}>
      <div className="eyebrow">{label}</div>
      <div className="stat-value">{value}</div>
      {subtext ? <div className="muted">{subtext}</div> : null}
    </div>
  );
}

function InboxPage() {
  const { rooms, roomCounts } = useShellState();
  const canGoAdmin = hasPermission(authStorage.getProfile(), 'admin.access');
  const primaryMeeting = rooms.find((room) => room.kind === 'meeting');
  const primaryVoice = rooms.find((room) => room.kind === 'voice');
  const primaryChat = rooms.find((room) => !['voice', 'meeting'].includes(room.kind));

  return (
    <div className="page-grid stack-lg">
      <section className="hero-banner glass">
        <div>
          <div className="eyebrow">Главная точка входа</div>
          <h2 className="section-title">Рабочая редакция V17: чат, файлы, голос и собрания</h2>
          <div className="muted">Лишние повторяющиеся заглушки вычищены. Приоритет — реальная демонстрация комнат, сотрудников, ролей, модерации и сценариев понедельника.</div>
        </div>
        <div className="stats-grid">
          <StatCard label="Всего комнат" value={rooms.length} subtext="Общий список доступных пространств" accent={true} />
          <StatCard label="Текстовые" value={roomCounts.chat} subtext="Рабочие каналы и личные диалоги" />
          <StatCard label="Голосовые" value={roomCounts.voice} subtext="Звонки, роли и управление участниками" />
        </div>
      </section>

      <section className="split-grid responsive-stack">
        <div className="card elevated stack">
          <strong>Что уже собрано в этом цикле</strong>
          <div className="feature-list compact-list">
            <div className="feature-row"><span>Один baseline и дисциплина релиза без параллельного хаоса.</span></div>
            <div className="feature-row"><span>Русский UI, профиль сотрудника, роли, права и реальные сессии.</span></div>
            <div className="feature-row"><span>Текстовая комната: поиск, ответы, редактирование, удаление, закрепы, файлы.</span></div>
            <div className="feature-row"><span>Голос: устройства, список сотрудников, статусы, действия модерации и перенос между комнатами.</span></div>
            <div className="feature-row"><span>Собрания: повестка, журнал событий, материалы и итоговый блок.</span></div>
          </div>
        </div>
        <div className="card elevated stack">
          <strong>Быстрые сценарии для демонстрации</strong>
          <div className="room-grid compact-room-grid">
            {primaryChat ? <NavLink className="room-card card elevated" to={`/app/rooms/${primaryChat.id}`}><div className="room-icon">💬</div><div className="stack-xs"><strong>{primaryChat.name}</strong><span className="muted">Открыть чат и файлы</span></div></NavLink> : null}
            {primaryVoice ? <NavLink className="room-card card elevated" to={`/app/voice/${primaryVoice.id}`}><div className="room-icon">🎙</div><div className="stack-xs"><strong>{primaryVoice.name}</strong><span className="muted">Показать голос и модерацию</span></div></NavLink> : null}
            {primaryMeeting ? <NavLink className="room-card card elevated" to={`/app/meetings/${primaryMeeting.id}`}><div className="room-icon">📋</div><div className="stack-xs"><strong>{primaryMeeting.name}</strong><span className="muted">Открыть собрание</span></div></NavLink> : null}
          </div>
          {canGoAdmin ? <NavLink className="button ghost" to="/app/admin">Открыть центр администратора</NavLink> : null}
        </div>
      </section>
    </div>
  );
}

function AttachmentList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="attachment-row">
      {items.map((item) => (
        <a key={item.id} className="attachment-chip" href={item.publicUrl} target="_blank" rel="noreferrer">
          <span>{item.fileKind === 'image' ? '🖼' : item.fileKind === 'video' ? '🎬' : item.fileKind === 'audio' ? '🎧' : '📎'}</span>
          <span>{item.originalName || item.fileName}</span>
          <span className="muted small">{formatFileSize(item.sizeBytes)}</span>
        </a>
      ))}
    </div>
  );
}

function MessageCard({ message, profile, myUserId, onReply, onEdit, onDelete, onTogglePin }) {
  const canDelete = (message.authorId === myUserId && hasPermission(profile, 'messages.delete_own')) || hasPermission(profile, 'messages.moderate');
  const canEdit = message.authorId === myUserId && !message.isDeleted && hasPermission(profile, 'messages.edit_own');
  const canPin = hasPermission(profile, 'messages.moderate');
  const mine = message.authorId === myUserId;

  return (
    <article className={cls('message-card', mine && 'mine', message.isDeleted && 'deleted')}>
      <div className="message-avatar">{initials(message.authorName || message.authorId || 'U')}</div>
      <div className="message-body card elevated">
        <div className="message-header">
          <div>
            <div className="message-author">{message.authorName || message.authorId || 'Сотрудник'}</div>
            <div className="muted small">{formatDateTime(message.createdAt)}</div>
          </div>
          <div className="message-tags">
            {message.replyToMessageId ? <span className="pill">Ответ</span> : null}
            {message.isPinned ? <span className="pill pill-accent">Закреп</span> : null}
            {message.isEdited ? <span className="pill">Изменено</span> : null}
            {message.isDeleted ? <span className="pill pill-danger">Удалено</span> : null}
          </div>
        </div>
        <div className="message-text pre-wrap">{message.text}</div>
        <AttachmentList items={message.attachments} />
        <div className="message-actions">
          {!message.isDeleted ? <button className="button ghost small" onClick={() => onReply(message)}>Ответить</button> : null}
          {canEdit ? <button className="button ghost small" onClick={() => onEdit(message)}>Редактировать</button> : null}
          {canDelete ? <button className="button ghost small" onClick={() => onDelete(message.id)}>Удалить</button> : null}
          {canPin ? <button className="button ghost small" onClick={() => onTogglePin(message.id, message.isPinned)}>{message.isPinned ? 'Снять закреп' : 'Закрепить'}</button> : null}
        </div>
      </div>
    </article>
  );
}

function RoomPage({ profile }) {
  const { roomId } = useParams();
  const { activeRoom, notify } = useShellState();
  const [items, setItems] = useState([]);
  const [pins, setPins] = useState([]);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  const myUserId = profile?.sub || profile?.id;
  const lastReadAt = useMemo(() => trackReadMarker(roomId), [roomId, items.length]);
  const timeline = useMemo(() => buildMessageTimeline(items, lastReadAt), [items, lastReadAt]);
  const pinnedCount = pins.length;
  const fileCount = files.length;

  async function load() {
    try {
      const [messagesPayload, pinsPayload, filesPayload] = await Promise.all([
        api.messages(roomId),
        api.roomPins(roomId),
        api.roomFiles(roomId)
      ]);
      setItems(messagesPayload);
      setPins(pinsPayload);
      setFiles(filesPayload);
    } catch {
      setItems([]);
      setPins([]);
      setFiles([]);
    }
  }

  useEffect(() => { load(); }, [roomId]);

  useEffect(() => {
    if (!items.length) return;
    const latest = items[items.length - 1]?.createdAt;
    if (latest) trackReadMarker(roomId, latest);
  }, [roomId, items]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const socket = await getSocket();
      if (disposed) return;
      socketRef.current = socket;
      socket.connect();
      socket.emit('room:join', { roomId }, () => undefined);

      const reload = () => load();
      const onTyping = ({ roomId: payloadRoomId, userId, value }) => {
        if (payloadRoomId !== roomId || userId === myUserId) return;
        setTypingUsers((current) => {
          const next = { ...current };
          if (value) next[userId] = Date.now(); else delete next[userId];
          return next;
        });
      };

      const events = new Map();
      ['message:created', 'message:updated', 'message:deleted', 'message:pinned'].forEach((event) => {
        const handler = (payload) => {
          if (payload?.roomId === roomId) {
            reload();
            if (event === 'message:created' && document.hidden) {
              notify({ title: 'Новое сообщение', message: `В комнате «${activeRoom?.name || 'Рабочая комната'}» появилось новое сообщение.`, tone: 'message' });
            }
          }
        };
        events.set(event, handler);
        socket.on(event, handler);
      });
      socket.on('message:typing', onTyping);

      cleanup = () => {
        socket.emit('room:leave', { roomId });
        events.forEach((handler, event) => socket.off(event, handler));
        socket.off('message:typing', onTyping);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, [roomId, myUserId, activeRoom?.name, notify]);

  function emitTyping(value) {
    socketRef.current?.emit('message:typing', { roomId, value });
  }

  function handleTextChange(value) {
    setText(value);
    emitTyping(Boolean(value.trim()));
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => emitTyping(false), 900);
  }

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.sendMessage(roomId, text, replyTo?.id || null);
      emitTyping(false);
      setText('');
      setReplyTo(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      await api.upload(roomId, file);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeMessage(id) {
    await api.deleteMessage(id);
    await load();
  }

  async function pinMessage(id, pinned) {
    if (pinned) await api.unpinMessage(id); else await api.pinMessage(id);
    await load();
  }

  async function saveEdit() {
    if (!editing?.id || !editing?.text?.trim()) return;
    await api.editMessage(editing.id, editing.text);
    setEditing(null);
    await load();
  }

  async function runSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchBusy(true);
    try {
      setSearchResults(await api.roomSearch(roomId, searchQuery));
    } finally {
      setSearchBusy(false);
    }
  }

  const typingLabels = Object.keys(typingUsers).length ? `Печатают: ${Object.keys(typingUsers).length}` : '';

  return (
    <div className="chat-layout expanded-chat-layout">
      <section className="chat-column stack-lg">
        <section className="hero-banner glass compact-hero">
          <div>
            <div className="eyebrow">Текстовая комната</div>
            <h2 className="section-title">{activeRoom?.name || 'Рабочая комната'}</h2>
            <div className="muted">Лента, ответы, закрепы, поиск и файлы остаются в одном плотном рабочем потоке без лишнего декоративного шума.</div>
          </div>
          <div className="meta-grid wide">
            <span className="meta-item">Сообщений: {items.length}</span>
            <span className="meta-item">Закрепов: {pinnedCount}</span>
            <span className="meta-item">Файлов: {fileCount}</span>
            {typingLabels ? <span className="meta-item">{typingLabels}</span> : <span className="meta-item">Realtime включён</span>}
          </div>
        </section>

        <section className="card elevated stack-sm">
          <div className="section-row compact">
            <strong>Поиск по комнате</strong>
            <span className="pill">Chat UX</span>
          </div>
          <div className="row wrap">
            <input className="search-input" placeholder="Найти сообщение, файл или фразу" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' ? runSearch() : undefined} />
            <button className="button ghost" disabled={searchBusy} onClick={runSearch}>{searchBusy ? 'Ищем...' : 'Поиск'}</button>
            {searchResults.length ? <span className="pill pill-accent">Совпадений: {searchResults.length}</span> : null}
          </div>
          {searchResults.length ? (
            <div className="search-results-grid">
              {searchResults.map((message) => (
                <div key={message.id} className="search-result-card">
                  <strong>{message.authorName || 'Сотрудник'}</strong>
                  <div className="muted small">{formatDateTime(message.createdAt)}</div>
                  <div className="pre-wrap">{message.text}</div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="messages-feed">
          {timeline.length ? timeline.map((entry) => {
            if (entry.type === 'day') return <div key={entry.key} className="day-separator"><span>{entry.label}</span></div>;
            if (entry.type === 'unread') return <div key={entry.key} className="unread-marker">Новые сообщения с момента последнего просмотра</div>;
            return (
              <MessageCard
                key={entry.key}
                message={entry.message}
                profile={profile}
                myUserId={myUserId}
                onReply={(value) => setReplyTo({ id: value.id, text: value.text, authorName: value.authorName })}
                onEdit={(value) => setEditing({ id: value.id, text: value.text })}
                onDelete={removeMessage}
                onTogglePin={pinMessage}
              />
            );
          }) : <div className="empty-state card">В этой комнате пока нет сообщений.</div>}
        </div>
      </section>

      <aside className="composer-panel card elevated stack">
        <div className="section-row compact">
          <strong>Область ввода</strong>
          <span className="pill">Файлы и ответы</span>
        </div>

        {replyTo ? (
          <div className="notice">
            <strong>Ответ:</strong> {replyTo.authorName || replyTo.id}
            <div className="muted">{replyTo.text}</div>
            <button className="button ghost small" onClick={() => setReplyTo(null)}>Снять ответ</button>
          </div>
        ) : null}

        {editing ? (
          <div className="stack">
            <div className="eyebrow">Редактирование сообщения</div>
            <textarea className="textarea composer-box" value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
            <div className="row wrap">
              <button className="button primary" onClick={saveEdit}>Сохранить</button>
              <button className="button ghost" onClick={() => setEditing(null)}>Отмена</button>
            </div>
          </div>
        ) : (
          <>
            <textarea className="textarea composer-box" placeholder="Введите сообщение в рабочую комнату..." value={text} onChange={(e) => handleTextChange(e.target.value)} onBlur={() => emitTyping(false)} />
            <div className="stack-sm">
              <input ref={fileRef} className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <div className="row wrap">
                <button className="button primary" disabled={busy} onClick={send}>Отправить сообщение</button>
                <button className="button ghost" disabled={busy || !file} onClick={upload}>Загрузить файл</button>
              </div>
            </div>
          </>
        )}

        <div className="stack-sm">
          <div className="section-row compact"><strong>Закрепы</strong><span className="pill">{pins.length}</span></div>
          <div className="list-rail">
            {pins.length ? pins.map((message) => <div className="mini-item" key={message.id}><strong>{message.authorName}</strong><span className="muted small pre-wrap">{message.text}</span></div>) : <div className="muted small">Закрепов пока нет.</div>}
          </div>
        </div>

        <div className="stack-sm">
          <div className="section-row compact"><strong>Файлы комнаты</strong><span className="pill">{files.length}</span></div>
          <div className="list-rail">
            {files.length ? files.slice(0, 8).map((item) => <a key={item.id} className="mini-item interactive" href={item.publicUrl} target="_blank" rel="noreferrer"><strong>{item.originalName}</strong><span className="muted small">{formatFileSize(item.sizeBytes)} · {item.authorName || 'Сотрудник'}</span></a>) : <div className="muted small">Файлы ещё не загружались.</div>}
          </div>
        </div>
      </aside>
    </div>
  );
}

function StreamView({ stream, muted = false }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const hasVideo = Boolean(stream?.getVideoTracks?.().length);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
    if (audioRef.current) audioRef.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className="media-frame">
      {hasVideo ? <video ref={videoRef} autoPlay playsInline muted={muted} className="media-video" /> : <div className="media-placeholder">Сейчас передаётся только аудио</div>}
      <audio ref={audioRef} autoPlay playsInline muted={muted} />
    </div>
  );
}

function VoiceRoomPage() {
  const { roomId } = useParams();
  const { rooms, activeRoom, setActiveRoom, notify } = useShellState();
  const currentProfile = authStorage.getProfile() || {};
  const currentUserId = currentProfile?.sub || currentProfile?.id;
  const controllerRef = useRef(null);
  const speakingIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const socketRef = useRef(null);
  const [rtcConfig, setRtcConfig] = useState({ iceServers: [] });
  const [voiceState, setVoiceState] = useState([]);
  const [remotePeers, setRemotePeers] = useState({});
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [localAudioStream, setLocalAudioStream] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [quality, setQuality] = useState('fhd');
  const [joinedVoice, setJoinedVoice] = useState(false);
  const [connectionState, setConnectionState] = useState('Подключаем сигнальный контур...');
  const [busyAction, setBusyAction] = useState('');
  const [devices, setDevices] = useState({ inputs: [], outputs: [] });
  const [selectedInput, setSelectedInput] = useState(currentProfile?.settings?.voiceInputDevice || '');
  const [selectedOutput, setSelectedOutput] = useState(currentProfile?.settings?.voiceOutputDevice || '');
  const [moveTargets, setMoveTargets] = useState({});
  const [summonNotes, setSummonNotes] = useState({});
  const [bulkNote, setBulkNote] = useState('');
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestNote, setRequestNote] = useState('');
  const [bulkSummonNote, setBulkSummonNote] = useState('');

  const qualityPresets = {
    fhd: { width: 1920, height: 1080, frameRate: 30, label: '1920×1080 / 30 кадров' },
    qhd: { width: 2560, height: 1440, frameRate: 30, label: '2560×1440 / 30 кадров' },
    fps60: { width: 1920, height: 1080, frameRate: 60, label: '1920×1080 / 60 кадров' }
  };

  const targetRooms = useMemo(() => rooms.filter((room) => ['voice', 'meeting'].includes(room.kind) && room.id !== roomId), [rooms, roomId]);
  const participants = useMemo(() => mergeVoiceMembers(activeRoom?.members || [], voiceState), [activeRoom, voiceState]);
  const selfParticipant = participants.find((item) => item.id === currentUserId) || null;
  const canModerateRoom = hasPermission(currentProfile, 'voice.moderate');
  const pendingJoinRequests = joinRequests.filter((item) => item.status === 'pending');
  const summonableMembers = participants.filter((item) => item.id !== currentUserId && !item.isConnected);

  function pushLog(value) {
    setLogs((items) => [value, ...items].slice(0, 40));
  }

  function patchParticipant(userId, patch) {
    setVoiceState((current) => {
      const index = current.findIndex((item) => item.userId === userId);
      if (index === -1) {
        return [...current, { userId, ...patch }];
      }
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  async function loadVoiceState() {
    try {
      const payload = await api.voiceState(roomId);
      setVoiceState(payload);
      const me = payload.find((item) => item.userId === currentUserId);
      setJoinedVoice(Boolean(me?.isConnected));
    } catch (err) {
      setError(extractError(err, 'Не удалось получить состояние голосовой комнаты.'));
    }
  }

  async function loadJoinRequests() {
    if (!canModerateRoom) return;
    try {
      setJoinRequests(await api.voiceRequests(roomId));
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить очередь запросов на вход.'));
    }
  }

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const [socket, rtc] = await Promise.all([getSocket(), api.rtcConfig()]);
        if (disposed) return;
        socketRef.current = socket;
        socket.connect();
        setRtcConfig(rtc);
        setConnectionState(socket.connected ? 'Сигнальный контур подключён' : 'Ожидаем подключение сигнального контура');

        socket.on('connect', () => setConnectionState('Сигнальный контур подключён'));
        socket.on('disconnect', () => setConnectionState('Сигнальный контур временно отключён'));
        socket.on('voice:participant', ({ roomId: eventRoomId, participant }) => {
          if (eventRoomId !== roomId || !participant) return;
          patchParticipant(participant.userId, participant);
        });
        socket.on('voice:moderation', ({ roomId: eventRoomId, participant, action, sourceRoomId }) => {
          if (eventRoomId === roomId && participant) patchParticipant(participant.userId, participant);
          if (sourceRoomId === roomId || eventRoomId === roomId) {
            pushLog(`Модерация: ${action}`);
            notify({ title: 'Голосовая модерация', message: `В комнате «${activeRoom?.name || 'Голосовая комната'}» выполнено действие: ${action}.`, tone: action === 'move_to_room' ? 'join' : 'alert' });
            loadVoiceState();
          }
        });
        socket.on('voice:speaking', ({ roomId: eventRoomId, userId, speaking }) => {
          if (eventRoomId !== roomId) return;
          patchParticipant(userId, { isSpeaking: Boolean(speaking) });
        });
        socket.on('voice:state', ({ roomId: eventRoomId, userId, patch }) => {
          if (eventRoomId !== roomId) return;
          patchParticipant(userId, patch || {});
        });
        socket.on('voice:bulk', ({ roomId: eventRoomId, action, state }) => {
          if (eventRoomId !== roomId) return;
          setVoiceState(state || []);
          pushLog(`Массовое действие: ${action}`);
          notify({ title: 'Массовая модерация', message: `В комнате применено действие: ${action}.`, tone: 'alert' });
        });
        socket.on('voice:request', ({ roomId: eventRoomId }) => {
          if (eventRoomId !== roomId || !canModerateRoom) return;
          loadJoinRequests();
        });
        socket.on('voice:request-review', ({ roomId: eventRoomId }) => {
          if (eventRoomId !== roomId) return;
          if (canModerateRoom) loadJoinRequests();
        });
        socket.on('voice:access', ({ roomId: eventRoomId }) => {
          if (eventRoomId !== roomId) return;
          api.room(roomId).then(setActiveRoom).catch(() => undefined);
        });

        const controller = new PeerMeshController({
          socket,
          roomId,
          currentUserId,
          rtcConfig: rtc,
          onRemoteStream: (userId, stream) => {
            setRemotePeers((current) => ({ ...current, [userId]: { ...(current[userId] || {}), stream } }));
          },
          onPeerEvent: (userId, patch) => {
            setRemotePeers((current) => {
              if (patch?.joined === false) {
                const next = { ...current };
                delete next[userId];
                return next;
              }
              return { ...current, [userId]: { ...(current[userId] || {}), ...patch } };
            });
          },
          onLog: pushLog,
          onLocalScreenStream: setLocalScreenStream,
          onLocalAudioStream: setLocalAudioStream
        });

        controllerRef.current = controller;
        await controller.join();
        await loadVoiceState();
        if (canModerateRoom) await loadJoinRequests();
        pushLog('Подключение к голосовой комнате выполнено.');
        notify({ title: 'Голосовой контур готов', message: `Комната «${activeRoom?.name || 'Голосовая комната'}» подключена.`, tone: 'join' });
      } catch (err) {
        setError(extractError(err, 'Не удалось инициализировать голосовой контур.'));
      }
    })();

    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((list) => {
        const inputs = list.filter((item) => item.kind === 'audioinput');
        const outputs = list.filter((item) => item.kind === 'audiooutput');
        setDevices({ inputs, outputs });
        if (!selectedInput && inputs[0]) setSelectedInput(inputs[0].deviceId);
        if (!selectedOutput && outputs[0]) setSelectedOutput(outputs[0].deviceId);
      }).catch(() => undefined);
    }

    return () => {
      disposed = true;
      if (speakingIntervalRef.current) window.clearInterval(speakingIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => undefined);
      socketRef.current?.off('connect');
      socketRef.current?.off('disconnect');
      socketRef.current?.off('voice:participant');
      socketRef.current?.off('voice:moderation');
      socketRef.current?.off('voice:speaking');
      socketRef.current?.off('voice:state');
      socketRef.current?.off('voice:bulk');
      socketRef.current?.off('voice:request');
      socketRef.current?.off('voice:request-review');
      socketRef.current?.off('voice:access');
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [roomId, currentUserId, activeRoom?.name, notify, canModerateRoom, setActiveRoom]);

  useEffect(() => {
    if (speakingIntervalRef.current) {
      window.clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    if (!localAudioStream) {
      socketRef.current?.emit('voice:speaking', { roomId, speaking: false });
      patchParticipant(currentUserId, { isSpeaking: false, isMuted: true });
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    const audioContext = new AudioCtor();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const source = audioContext.createMediaStreamSource(localAudioStream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let currentSpeaking = false;

    speakingIntervalRef.current = window.setInterval(() => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / (data.length || 1);
      const nextSpeaking = average > 18;
      if (nextSpeaking !== currentSpeaking) {
        currentSpeaking = nextSpeaking;
        socketRef.current?.emit('voice:speaking', { roomId, speaking: nextSpeaking });
        patchParticipant(currentUserId, { isSpeaking: nextSpeaking });
      }
    }, 300);

    return () => {
      if (speakingIntervalRef.current) window.clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
      audioContext.close().catch(() => undefined);
      audioContextRef.current = null;
    };
  }, [localAudioStream, roomId, currentUserId]);

  async function requestRoomAccess() {
    setBusyAction('request-access');
    setError('');
    try {
      await api.voiceRequestAccess(roomId, { note: requestNote });
      setRequestNote('');
      notify({ title: 'Запрос отправлен', message: 'Ведущий или модератор увидит ваш запрос на вход в голосовую комнату.', tone: 'message' });
      if (canModerateRoom) await loadJoinRequests();
    } catch (err) {
      setError(extractError(err, 'Не удалось отправить запрос на вход.'));
    } finally {
      setBusyAction('');
    }
  }

  async function reviewJoinRequest(requestId, status) {
    setBusyAction(`review:${requestId}:${status}`);
    setError('');
    try {
      await api.voiceReviewRequest(roomId, { requestId, status });
      await loadJoinRequests();
    } catch (err) {
      setError(extractError(err, 'Не удалось обработать запрос на вход.'));
    } finally {
      setBusyAction('');
    }
  }

  async function updateEntryMode(nextMode) {
    setBusyAction(`entry:${nextMode}`);
    setError('');
    try {
      const updatedRoom = await api.voiceSetAccess(roomId, { entryMode: nextMode });
      setActiveRoom((current) => current ? { ...current, entryMode: updatedRoom.entryMode } : current);
      notify({ title: 'Режим входа обновлён', message: `Для комнаты теперь действует режим: ${voiceEntryModeLabel(updatedRoom.entryMode)}.`, tone: 'message' });
      if (canModerateRoom) await loadJoinRequests();
    } catch (err) {
      setError(extractError(err, 'Не удалось изменить режим входа в комнату.'));
    } finally {
      setBusyAction('');
    }
  }

  async function joinVoice() {
    setBusyAction('join');
    setError('');
    try {
      const participant = await api.voiceJoin(roomId, { isMuted: !localAudioStream, handRaised: false, screenActive: Boolean(localScreenStream) });
      setJoinedVoice(true);
      patchParticipant(participant.userId, participant);
      pushLog('Пользователь вошёл в голосовую комнату.');
    } catch (err) {
      setError(extractError(err, 'Не удалось войти в голосовую комнату.'));
    } finally {
      setBusyAction('');
    }
  }

  async function leaveVoice() {
    setBusyAction('leave');
    setError('');
    try {
      await controllerRef.current?.stopAudio().catch(() => undefined);
      await controllerRef.current?.stopScreen().catch(() => undefined);
      const participant = await api.voiceLeave(roomId);
      setJoinedVoice(false);
      patchParticipant(participant.userId, participant);
      pushLog('Пользователь покинул голосовую комнату.');
    } catch (err) {
      setError(extractError(err, 'Не удалось выйти из голосовой комнаты.'));
    } finally {
      setBusyAction('');
    }
  }

  async function startMic() {
    try {
      setError('');
      await controllerRef.current?.startAudio(selectedInput);
      const participant = await api.voiceSelf(roomId, { isMuted: false, isSpeaking: false });
      patchParticipant(participant.userId, participant);
      socketRef.current?.emit('voice:state', { roomId, patch: { isMuted: false } });
    } catch (err) {
      setError(deviceErrorLabel(err));
    }
  }

  async function stopMic() {
    try {
      setError('');
      await controllerRef.current?.stopAudio();
      const participant = await api.voiceSelf(roomId, { isMuted: true, isSpeaking: false });
      patchParticipant(participant.userId, participant);
      socketRef.current?.emit('voice:state', { roomId, patch: { isMuted: true, isSpeaking: false } });
    } catch (err) {
      setError(deviceErrorLabel(err));
    }
  }

  async function toggleHand() {
    try {
      setError('');
      const participant = await api.voiceSelf(roomId, { handRaised: !selfParticipant?.handRaised });
      patchParticipant(participant.userId, participant);
      socketRef.current?.emit('voice:state', { roomId, patch: { handRaised: participant.handRaised } });
    } catch (err) {
      setError(extractError(err, 'Не удалось изменить состояние руки.'));
    }
  }

  async function startScreen() {
    try {
      setError('');
      await controllerRef.current?.startScreen(qualityPresets[quality]);
      const participant = await api.voiceSelf(roomId, { screenActive: true });
      patchParticipant(participant.userId, participant);
      socketRef.current?.emit('voice:state', { roomId, patch: { screenActive: true } });
    } catch (err) {
      setError(deviceErrorLabel(err));
    }
  }

  async function stopScreen() {
    try {
      setError('');
      await controllerRef.current?.stopScreen();
      const participant = await api.voiceSelf(roomId, { screenActive: false });
      patchParticipant(participant.userId, participant);
      socketRef.current?.emit('voice:state', { roomId, patch: { screenActive: false } });
    } catch (err) {
      setError(deviceErrorLabel(err));
    }
  }

  async function saveDevices() {
    try {
      await api.updateMeSettings({ ...(currentProfile?.settings || {}), voiceInputDevice: selectedInput, voiceOutputDevice: selectedOutput });
      pushLog('Устройства сохранены в личных настройках.');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить выбранные устройства.'));
    }
  }

  async function summon(targetUserId) {
    try {
      setBusyAction(`summon:${targetUserId}`);
      await api.voiceSummon(roomId, { targetUserId, note: summonNotes[targetUserId] || '' });
      notify({ title: 'Вызов отправлен', message: 'Сотрудник получил приглашение перейти в комнату.', tone: 'join' });
    } catch (err) {
      setError(extractError(err, 'Не удалось отправить вызов в комнату.'));
    } finally {
      setBusyAction('');
    }
  }

  async function moderate(action, targetUserId) {
    try {
      setBusyAction(`${action}:${targetUserId}`);
      const payload = { action, targetUserId };
      if (action === 'move_to_room') payload.targetRoomId = moveTargets[targetUserId] || targetRooms[0]?.id || '';
      await api.voiceModerate(roomId, payload);
      await loadVoiceState();
    } catch (err) {
      setError(extractError(err, 'Не удалось выполнить действие модерации.'));
    } finally {
      setBusyAction('');
    }
  }

  async function bulkModerate(action) {
    try {
      setBusyAction(`bulk:${action}`);
      const result = await api.voiceBulk(roomId, { action, note: bulkNote });
      setVoiceState(result.state || []);
      setBulkNote('');
    } catch (err) {
      setError(extractError(err, 'Не удалось выполнить массовое действие.'));
    } finally {
      setBusyAction('');
    }
  }

  async function summonAbsentMembers() {
    try {
      setBusyAction('summon:absent');
      const result = await api.voiceSummonMany(roomId, { userIds: summonableMembers.map((item) => item.id), note: bulkSummonNote || 'Подключайтесь в голосовую комнату.' });
      setBulkSummonNote('');
      notify({ title: 'Массовый вызов отправлен', message: `В комнату вызвано сотрудников: ${result.count || 0}.`, tone: 'join' });
    } catch (err) {
      setError(extractError(err, 'Не удалось вызвать сотрудников в комнату.'));
    } finally {
      setBusyAction('');
    }
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner glass voice-hero">
        <div>
          <div className="eyebrow">Голос и демонстрация экрана</div>
          <h2 className="section-title">{activeRoom?.name || 'Голосовая комната'}</h2>
          <div className="muted">Сотрудники, роли, статусы, кнопки модерации и перенос участников теперь собраны в одном экране без пустых блоков.</div>
        </div>
        <div className="control-row wrap">
          {!joinedVoice ? <button className="button primary" disabled={busyAction === 'join'} onClick={joinVoice}>Войти в голос</button> : <button className="button ghost" disabled={busyAction === 'leave'} onClick={leaveVoice}>Выйти из голоса</button>}
          <button className="button primary" disabled={!joinedVoice} onClick={startMic}>Включить микрофон</button>
          <button className="button ghost" disabled={!joinedVoice} onClick={stopMic}>Выключить микрофон</button>
          <button className="button ghost" disabled={!joinedVoice} onClick={toggleHand}>{selfParticipant?.handRaised ? 'Опустить руку' : 'Поднять руку'}</button>
        </div>
      </section>

      <div className="meta-grid wide">
        <span className="meta-item">Статус: {connectionState}</span>
        <span className="meta-item">Участников в голосе: {voiceState.filter((item) => item.isConnected).length}</span>
        <span className="meta-item">Поднятых рук: {voiceState.filter((item) => item.handRaised).length}</span>
        <span className="meta-item">Режим входа: {voiceEntryModeLabel(activeRoom?.entryMode)}</span>
        <span className="meta-item">Заявок: {pendingJoinRequests.length || activeRoom?.pendingJoinRequestsCount || 0}</span>
        <span className="meta-item">ICE-серверов: {rtcConfig.iceServers?.length ? rtcConfig.iceServers.length : 0}</span>
        <span className="meta-item">Качество экрана: {qualityPresets[quality].label}</span>
      </div>

      {canModerateRoom ? (
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Контроль входа в голос</strong><span className="pill">{voiceEntryModeLabel(activeRoom?.entryMode)}</span></div>
          <div className="row wrap">
            <button className="button ghost" disabled={busyAction === 'entry:open' || activeRoom?.entryMode === 'open'} onClick={() => updateEntryMode('open')}>Свободный вход</button>
            <button className="button ghost" disabled={busyAction === 'entry:knock' || activeRoom?.entryMode === 'knock'} onClick={() => updateEntryMode('knock')}>Вход по запросу</button>
            <button className="button danger" disabled={busyAction === 'entry:closed' || activeRoom?.entryMode === 'closed'} onClick={() => updateEntryMode('closed')}>Закрыть вход</button>
          </div>
          <div className="section-row compact"><strong>Очередь запросов</strong><span className="pill">{pendingJoinRequests.length}</span></div>
          <div className="list-rail">
            {pendingJoinRequests.length ? pendingJoinRequests.map((item) => (
              <div key={item.id} className="mini-item stack-sm">
                <div className="row between">
                  <div className="stack-xs">
                    <strong>{item.displayName}</strong>
                    <span className="muted small">{roleLabel(item.role)} · {item.jobTitle || 'Должность не указана'} · {item.departmentName || 'Без отдела'}</span>
                    <span className="muted small">Запрос: {formatDateTime(item.requestedAt)}</span>
                  </div>
                  <div className="row wrap">
                    <button className="button ghost small" disabled={busyAction === `review:${item.id}:approved`} onClick={() => reviewJoinRequest(item.id, 'approved')}>Одобрить</button>
                    <button className="button danger small" disabled={busyAction === `review:${item.id}:denied`} onClick={() => reviewJoinRequest(item.id, 'denied')}>Отклонить</button>
                  </div>
                </div>
                {item.note ? <div className="muted small pre-wrap">{item.note}</div> : null}
              </div>
            )) : <div className="muted small">Новых запросов на вход сейчас нет.</div>}
          </div>
        </section>
      ) : activeRoom?.entryMode === 'closed' && !joinedVoice ? (
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Вход в голос закрыт</strong><span className="pill pill-danger">Ограничение ведущего</span></div>
          <div className="muted">Ведущий или модератор временно закрыл вход в эту комнату. Дождитесь открытия входа или прямого вызова.</div>
        </section>
      ) : activeRoom?.entryMode === 'knock' && !joinedVoice ? (
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Вход в голос по запросу</strong><span className="pill">Контролируемый доступ</span></div>
          <div className="muted">Для этой комнаты ведущий или модератор должен одобрить вход в голосовой контур. Оставьте короткий комментарий и отправьте запрос.</div>
          <input className="input" placeholder="Например: подключаюсь на обсуждение релиза" value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
          <button className="button primary" disabled={busyAction === 'request-access'} onClick={requestRoomAccess}>{busyAction === 'request-access' ? 'Отправляем запрос...' : 'Запросить вход в голос'}</button>
        </section>
      ) : null}

      {hasPermission(currentProfile, 'voice.moderate') ? (
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Массовая модерация комнаты</strong><span className="pill">Для ведущего и модератора</span></div>
          <div className="row wrap">
            <button className="button ghost" disabled={busyAction === 'bulk:mute_all'} onClick={() => bulkModerate('mute_all')}>Отключить всем микрофоны</button>
            <button className="button ghost" disabled={busyAction === 'bulk:unmute_all'} onClick={() => bulkModerate('unmute_all')}>Снять mute у всех</button>
            <button className="button ghost" disabled={busyAction === 'bulk:lower_all_hands'} onClick={() => bulkModerate('lower_all_hands')}>Опустить все руки</button>
            <button className="button ghost" disabled={busyAction === 'bulk:stop_all_screens'} onClick={() => bulkModerate('stop_all_screens')}>Остановить все экраны</button>
            <button className="button danger" disabled={busyAction === 'bulk:disconnect_all'} onClick={() => bulkModerate('disconnect_all')}>Вывести всех из голоса</button>
          </div>
          <input className="input" placeholder="Комментарий к массовому действию (необязательно)" value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} />
          <div className="section-row compact"><strong>Массовый вызов сотрудников</strong><span className="pill">Вне голоса: {summonableMembers.length}</span></div>
          <input className="input" placeholder="Комментарий к массовому вызову" value={bulkSummonNote} onChange={(e) => setBulkSummonNote(e.target.value)} />
          <button className="button primary" disabled={busyAction === 'summon:absent' || !summonableMembers.length} onClick={summonAbsentMembers}>Вызвать всех вне голоса</button>
        </section>
      ) : null}

      {error ? <div className="notice danger">{error}</div> : null}

      <div className="split-grid responsive-stack voice-main-grid">
        <section className="card elevated stack">
          <div className="section-row compact">
            <strong>Сотрудники комнаты</strong>
            <span className="pill">{participants.length}</span>
          </div>
          <div className="member-list">
            {participants.map((member) => (
              <div className="member-row voice-member-row" key={member.id}>
                <div className="user-avatar small">{initials(member.displayName)}</div>
                <div className="stack-xs fill">
                  <strong>{member.displayName}</strong>
                  <div className="muted small">{roleLabel(member.role)} · {member.jobTitle || 'Должность не указана'} · {member.departmentName || 'Без отдела'}</div>
                  <div className="member-chip-list">
                    <span className="pill">{voiceRoleLabel(member.voiceRole)}</span>
                    <span className="pill">{member.isConnected ? 'В комнате' : 'Не в комнате'}</span>
                    {member.isMuted ? <span className="pill">Без микрофона</span> : null}
                    {member.isSpeaking ? <span className="pill pill-accent">Говорит</span> : null}
                    {member.handRaised ? <span className="pill">Поднята рука</span> : null}
                    {member.screenActive ? <span className="pill pill-accent">Показывает экран</span> : null}
                    {member.voiceBanned ? <span className="pill pill-danger">Голос запрещён</span> : null}
                  </div>
                </div>
                {hasPermission(currentProfile, 'voice.moderate') ? (
                  <div className="member-actions-grid">
                    <button className="button ghost small" disabled={busyAction === `mute:${member.id}`} onClick={() => moderate(member.isMuted ? 'unmute' : 'mute', member.id)}>{member.isMuted ? 'Включить' : 'Отключить'} микрофон</button>
                    <button className="button ghost small" disabled={busyAction === `deafen:${member.id}`} onClick={() => moderate(member.isDeafened ? 'undeafen' : 'deafen', member.id)}>{member.isDeafened ? 'Снять deaf' : 'Deaf'}</button>
                    <button className="button ghost small" onClick={() => moderate(member.handRaised ? 'hand_down' : 'hand_up', member.id)}>{member.handRaised ? 'Опустить руку' : 'Поднять руку'}</button>
                    <button className="button ghost small" onClick={() => moderate(member.voiceRole === 'moderator' ? 'remove_moderator' : 'make_moderator', member.id)}>{member.voiceRole === 'moderator' ? 'Снять модератора' : 'Сделать модератором'}</button>
                    <button className="button ghost small" onClick={() => moderate('assign_host', member.id)}>Назначить ведущим</button>
                    <button className="button ghost small" onClick={() => moderate(member.voiceBanned ? 'unban_voice' : 'ban_voice', member.id)}>{member.voiceBanned ? 'Снять запрет' : 'Запретить голос'}</button>
                    <button className="button ghost small" onClick={() => moderate('remove', member.id)}>Удалить из комнаты</button>
                    <div className="row wrap">
                      <select className="select-inline compact-select" value={moveTargets[member.id] || targetRooms[0]?.id || ''} onChange={(e) => setMoveTargets((current) => ({ ...current, [member.id]: e.target.value }))}>
                        {targetRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                      </select>
                      <button className="button ghost small" disabled={!targetRooms.length} onClick={() => moderate('move_to_room', member.id)}>Перетянуть</button>
                    </div>
                    <div className="row wrap">
                      <input className="input inline-input" placeholder="Комментарий к вызову" value={summonNotes[member.id] || ''} onChange={(e) => setSummonNotes((current) => ({ ...current, [member.id]: e.target.value }))} />
                      <button className="button ghost small" disabled={busyAction === `summon:${member.id}`} onClick={() => summon(member.id)}>Вызвать в комнату</button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="card elevated stack">
          <div className="section-row compact">
            <strong>Устройства и экран</strong>
            <span className="pill">Voice UX</span>
          </div>
          <label className="field"><span>Устройство ввода</span><select className="select-inline" value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)}>{devices.inputs.map((item) => <option key={item.deviceId} value={item.deviceId}>{item.label || `Микрофон ${item.deviceId.slice(0, 6)}`}</option>)}</select></label>
          <label className="field"><span>Устройство вывода</span><select className="select-inline" value={selectedOutput} onChange={(e) => setSelectedOutput(e.target.value)}>{devices.outputs.map((item) => <option key={item.deviceId} value={item.deviceId}>{item.label || `Вывод ${item.deviceId.slice(0, 6)}`}</option>)}</select></label>
          <div className="row wrap">
            <select className="select-inline" value={quality} onChange={(e) => setQuality(e.target.value)}>
              {Object.entries(qualityPresets).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
            </select>
            <button className="button primary" disabled={!joinedVoice} onClick={startScreen}>Начать показ экрана</button>
            <button className="button ghost" disabled={!joinedVoice} onClick={stopScreen}>Остановить показ</button>
            <button className="button ghost" onClick={saveDevices}>Сохранить как устройства по умолчанию</button>
          </div>
          {localScreenStream ? <div className="stack"><strong>Локальный показ</strong><StreamView stream={localScreenStream} muted={true} /></div> : <div className="muted small">Демонстрация экрана сейчас не запущена.</div>}
        </section>
      </div>

      <div className="media-grid">
        {Object.entries(remotePeers).map(([userId, peer]) => (
          <div className="peer-card card elevated stack" key={userId}>
            <div className="section-row compact">
              <strong>{participants.find((item) => item.id === userId)?.displayName || userId}</strong>
              <div className="row wrap">
                {peer.screenActive ? <span className="pill pill-accent">Экран</span> : null}
                {peer.muted ? <span className="pill">Без микрофона</span> : null}
              </div>
            </div>
            {peer.stream ? <StreamView stream={peer.stream} muted={false} /> : <div className="media-placeholder">Ожидаем медиа-поток участника…</div>}
          </div>
        ))}
      </div>

      <section className="stack">
        <div className="section-row compact">
          <strong>Лог событий</strong>
          <span className="pill">RTC / moderation</span>
        </div>
        <div className="log-list">
          {logs.length ? logs.map((item, index) => <div key={index} className="log-item monospace">{item}</div>) : <div className="empty-state card">События голосового контура появятся после входа участников.</div>}
        </div>
      </section>
    </div>
  );
}

function MeetingRoomPage() {
  const { roomId } = useParams();
  const { activeRoom, notify } = useShellState();
  const currentProfile = authStorage.getProfile() || {};
  const [detail, setDetail] = useState({ meeting: null, members: [], voiceState: [], events: [], presenceJournal: [], materials: [], pins: [] });
  const [form, setForm] = useState({ title: '', agenda: '', summary: '', status: 'planned' });
  const [eventForm, setEventForm] = useState({ eventType: 'note', body: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [summonNote, setSummonNote] = useState('');

  const participants = useMemo(() => mergeVoiceMembers(detail.members, detail.voiceState), [detail]);
  const canManage = hasPermission(currentProfile, 'meetings.manage');
  const missingParticipants = participants.filter((item) => !item.isConnected);

  async function load() {
    try {
      const payload = await api.meetingDetail(roomId);
      setDetail(payload);
      setForm({
        title: inputValue(payload.meeting?.title),
        agenda: inputValue(payload.meeting?.agenda),
        summary: inputValue(payload.meeting?.summary),
        status: payload.meeting?.status || 'planned'
      });
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить данные собрания.'));
    }
  }

  useEffect(() => { load(); }, [roomId]);

  async function saveMeeting() {
    setBusy(true);
    setError('');
    try {
      await api.updateMeeting(roomId, form);
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось обновить параметры собрания.'));
    } finally {
      setBusy(false);
    }
  }

  async function addEvent() {
    setBusy(true);
    setError('');
    try {
      await api.addMeetingEvent(roomId, eventForm);
      setEventForm({ ...eventForm, body: '' });
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось добавить событие собрания.'));
    } finally {
      setBusy(false);
    }
  }

  async function runMeetingAction(action, note = '') {
    setBusy(true);
    setError('');
    try {
      const result = await api.meetingAction(roomId, { action, note });
      notify({ title: 'Быстрое действие собрания', message: result.label || 'Действие выполнено.', tone: action === 'close_meeting' ? 'alert' : 'join' });
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось выполнить быстрое действие собрания.'));
    } finally {
      setBusy(false);
    }
  }

  async function summonMissingParticipants() {
    setBusy(true);
    setError('');
    try {
      const result = await api.voiceSummonMany(roomId, { userIds: missingParticipants.map((item) => item.id), note: summonNote || 'Подключайтесь в комнату собрания.' });
      setSummonNote('');
      notify({ title: 'Участники вызваны', message: `В комнату собрания вызвано сотрудников: ${result.count || 0}.`, tone: 'join' });
    } catch (err) {
      setError(extractError(err, 'Не удалось вызвать участников в комнату собрания.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner glass">
        <div>
          <div className="eyebrow">Отдельный тип комнаты</div>
          <h2 className="section-title">{activeRoom?.name || 'Комната для собраний'}</h2>
          <div className="muted">Повестка, ведущий, материалы, участники и журнал событий собраны в одном сценарии. Комната не смешивается с обычным чатом или голосом.</div>
        </div>
        <div className="meta-grid wide">
          <span className="meta-item">Статус: {detail.meeting?.status || 'planned'}</span>
          <span className="meta-item">Ведущий: {detail.meeting?.hostName || 'Не назначен'}</span>
          <span className="meta-item">Участников: {participants.length}</span>
          <span className="meta-item">Материалов: {detail.materials.length}</span>
        </div>
      </section>

      {error ? <div className="notice danger">{error}</div> : null}

      {canManage ? (
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Быстрые действия ведущего</strong><span className="pill pill-accent">Launch control</span></div>
          <div className="row wrap">
            <button className="button primary" disabled={busy || form.status === 'active'} onClick={() => runMeetingAction('open_meeting', 'Собрание открыто ведущим через быстрые действия.')}>Открыть собрание</button>
            <button className="button ghost" disabled={busy || form.status === 'closed'} onClick={() => runMeetingAction('close_meeting', form.summary || 'Собрание завершено ведущим через быстрые действия.')}>Завершить собрание</button>
            <button className="button ghost" disabled={busy} onClick={() => runMeetingAction('mute_all', 'Всем участникам отключены микрофоны ведущим.')}>Отключить всем микрофоны</button>
            <button className="button ghost" disabled={busy} onClick={() => runMeetingAction('lower_all_hands', 'Поднятые руки сброшены ведущим.')}>Сбросить все руки</button>
            <button className="button ghost" disabled={busy} onClick={() => runMeetingAction('stop_all_screens', 'Все демонстрации экрана остановлены ведущим.')}>Остановить все экраны</button>
          </div>
          <div className="section-row compact"><strong>Массовый вызов отсутствующих</strong><span className="pill">Вне голоса: {missingParticipants.length}</span></div>
          <input className="input" placeholder="Комментарий к вызову на собрание" value={summonNote} onChange={(e) => setSummonNote(e.target.value)} />
          <button className="button primary" disabled={busy || !missingParticipants.length} onClick={summonMissingParticipants}>Вызвать всех отсутствующих</button>
        </section>
      ) : null}

      <section className="card elevated stack">
        <div className="section-row compact"><strong>Посещаемость и присутствие</strong><span className="pill">Meeting control</span></div>
        <div className="meta-grid wide">
          <span className="meta-item">В голосе: {participants.filter((item) => item.isConnected).length}</span>
          <span className="meta-item">Вне голоса: {participants.filter((item) => !item.isConnected).length}</span>
          <span className="meta-item">Подняли руку: {participants.filter((item) => item.handRaised).length}</span>
          <span className="meta-item">Показывают экран: {participants.filter((item) => item.screenActive).length}</span>
        </div>
        <div className="list-rail">
          {missingParticipants.length ? missingParticipants.map((item) => (
            <div key={item.id} className="mini-item">
              <strong>{item.displayName}</strong>
              <span className="muted small">Не в голосе · {roleLabel(item.role)} · {item.jobTitle || 'Должность не указана'}</span>
            </div>
          )) : <div className="muted small">Все участники уже присутствуют в голосовом контуре собрания.</div>}
        </div>
      </section>

      <div className="split-grid responsive-stack">
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Повестка и итог</strong><span className="pill">Meeting</span></div>
          <label className="field"><span>Название собрания</span><input className="input" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} disabled={!canManage} /></label>
          <label className="field"><span>Статус</span><select className="select-inline" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))} disabled={!canManage}><option value="planned">Запланировано</option><option value="active">Идёт сейчас</option><option value="closed">Завершено</option></select></label>
          <label className="field"><span>Повестка</span><textarea className="textarea meeting-box" value={form.agenda} onChange={(e) => setForm((current) => ({ ...current, agenda: e.target.value }))} disabled={!canManage} /></label>
          <label className="field"><span>Итог собрания</span><textarea className="textarea meeting-box" value={form.summary} onChange={(e) => setForm((current) => ({ ...current, summary: e.target.value }))} disabled={!canManage} /></label>
          {canManage ? <button className="button primary" disabled={busy} onClick={saveMeeting}>{busy ? 'Сохраняем...' : 'Сохранить собрание'}</button> : null}
        </section>

        <section className="card elevated stack">
          <div className="section-row compact"><strong>Участники и роли</strong><span className="pill">{participants.length}</span></div>
          <div className="member-list">
            {participants.map((member) => (
              <div className="member-row" key={member.id}>
                <div className="user-avatar small">{initials(member.displayName)}</div>
                <div className="stack-xs fill">
                  <strong>{member.displayName}</strong>
                  <div className="muted small">{roleLabel(member.role)} · {member.jobTitle || 'Должность не указана'} · {member.departmentName || 'Без отдела'}</div>
                </div>
                <div className="member-chip-list">
                  <span className="pill">{voiceRoleLabel(member.voiceRole)}</span>
                  {member.isConnected ? <span className="pill pill-accent">В голосе</span> : null}
                  {member.handRaised ? <span className="pill">Поднята рука</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="split-grid responsive-stack">
        <section className="card elevated stack">
          <div className="section-row compact"><strong>Материалы и закрепы</strong><span className="pill">{detail.materials.length + detail.pins.length}</span></div>
          <div className="list-rail">
            {detail.materials.map((item) => <a key={item.id} className="mini-item interactive" href={item.publicUrl} target="_blank" rel="noreferrer"><strong>{item.originalName}</strong><span className="muted small">{formatFileSize(item.sizeBytes)}</span></a>)}
            {detail.pins.map((item) => <div key={item.id} className="mini-item"><strong>{item.authorName}</strong><span className="muted small pre-wrap">{item.text}</span></div>)}
            {!detail.materials.length && !detail.pins.length ? <div className="muted small">Материалы и закрепы пока не добавлены.</div> : null}
          </div>
        </section>

        <section className="card elevated stack">
          <div className="section-row compact"><strong>Журнал событий</strong><span className="pill">{detail.events.length}</span></div>
          <label className="field"><span>Тип события</span><select className="select-inline" value={eventForm.eventType} onChange={(e) => setEventForm((current) => ({ ...current, eventType: e.target.value }))}><option value="note">Заметка</option><option value="decision">Решение</option><option value="action">Действие</option><option value="start">Старт</option><option value="finish">Завершение</option></select></label>
          <label className="field"><span>Описание события</span><textarea className="textarea meeting-box" value={eventForm.body} onChange={(e) => setEventForm((current) => ({ ...current, body: e.target.value }))} /></label>
          <button className="button ghost" disabled={busy} onClick={addEvent}>Добавить событие</button>
          <div className="log-list meeting-log-list">
            {detail.events.length ? detail.events.map((event) => <div key={event.id} className="log-item"><strong>{event.actorName || 'Система'} · {event.eventType}</strong><div className="muted small">{formatDateTime(event.createdAt)}</div><div className="pre-wrap">{event.body}</div></div>) : <div className="empty-state card">Журнал событий пока пуст.</div>}
          </div>
        </section>
      </div>

      <section className="card elevated stack">
        <div className="section-row compact"><strong>Журнал присутствия</strong><span className="pill">{detail.presenceJournal?.length || 0}</span></div>
        <div className="audit-list">
          {detail.presenceJournal?.length ? detail.presenceJournal.map((entry) => (
            <div className="audit-row card elevated" key={entry.id}>
              <div className="audit-main">
                <strong>{entry.userDisplayName || 'Сотрудник'} · {meetingPresenceEventLabel(entry.eventType)}</strong>
                <div className="muted small">{formatDateTime(entry.createdAt)}{entry.actorDisplayName ? ` · инициатор: ${entry.actorDisplayName}` : ''}</div>
                {entry.note ? <div className="muted small pre-wrap">{entry.note}</div> : null}
              </div>
            </div>
          )) : <div className="empty-state card">Журнал присутствия пока пуст.</div>}
        </div>
      </section>
    </div>
  );
}

function AccessDeniedPage({ title = 'Доступ ограничен', message = 'У вашей роли сейчас нет прав на этот раздел.' }) {
  return (
    <div className="standalone-layout">
      <section className="card elevated stack-lg standalone-card">
        <div className="eyebrow">Контроль доступа</div>
        <h1 className="section-title">{title}</h1>
        <div className="notice danger">{message}</div>
        <NavLink className="button ghost" to="/app/inbox">Вернуться на главную</NavLink>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="standalone-layout">
      <section className="card elevated stack-lg standalone-card">
        <div className="eyebrow">Навигация</div>
        <h1 className="section-title">Раздел не найден</h1>
        <div className="muted">Проверьте маршрут или вернитесь в рабочий контур.</div>
        <NavLink className="button primary" to="/app/inbox">Открыть главную</NavLink>
      </section>
    </div>
  );
}

function PermissionGuard({ profile, permission, title, message, children }) {
  if (!hasPermission(profile, permission)) {
    return <AccessDeniedPage title={title} message={message} />;
  }
  return children;
}

function SettingsPage({ profile, onProfile, theme, setTheme }) {
  const [settings, setSettings] = useState(() => profile?.settings || {
    theme: theme || 'dark',
    notificationsEnabled: true,
    soundEnabled: true,
    desktopNotifications: true,
    compactMode: false,
    enterToSend: true,
    pushToTalk: false,
    voiceInputDevice: '',
    voiceOutputDevice: '',
    fontScale: 'normal',
    highContrast: false,
    reduceMotion: false
  });
  const [state, setState] = useState({ busy: false, error: '', success: '' });

  useEffect(() => {
    api.meSettings().then((data) => setSettings(data)).catch(() => null);
  }, []);

  function toggleField(name) {
    setSettings((current) => ({ ...current, [name]: !current[name] }));
  }

  async function save() {
    setState({ busy: true, error: '', success: '' });
    try {
      const saved = await api.updateMeSettings(settings);
      setSettings(saved);
      setTheme(saved.theme === 'system' ? 'dark' : saved.theme);
      const nextProfile = { ...(profile || {}), settings: saved };
      onProfile(nextProfile);
      authStorage.setSession({ user: nextProfile });
      setState({ busy: false, error: '', success: 'Настройки сохранены.' });
    } catch (error) {
      setState({ busy: false, error: extractError(error, 'Не удалось сохранить настройки.'), success: '' });
    }
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner glass">
        <div>
          <div className="eyebrow">Настройки сотрудника</div>
          <h2 className="section-title">Уведомления, внешний вид и голос</h2>
          <div className="muted">Этап 3 выносит настройки в отдельный модуль: не декоративный набор переключателей, а полноценный пользовательский контур.</div>
        </div>
        <div className="stats-grid three">
          <StatCard label="Тема" value={settings.theme === 'light' ? 'Светлая' : settings.theme === 'system' ? 'Системная' : 'Тёмная'} subtext="Единый стиль интерфейса" accent={true} />
          <StatCard label="Уведомления" value={settings.notificationsEnabled ? 'Вкл' : 'Выкл'} subtext="Персональный контур" />
          <StatCard label="Голос" value={settings.pushToTalk ? 'PTT' : 'Обычный'} subtext="Поведение микрофона" />
        </div>
      </section>

      {state.error ? <div className="notice danger">{state.error}</div> : null}
      {state.success ? <div className="notice success">{state.success}</div> : null}

      <div className="split-grid responsive-stack">
        <section className="card elevated stack">
          <strong>Уведомления и плотность</strong>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.notificationsEnabled)} onChange={() => toggleField('notificationsEnabled')} /><span>Показывать уведомления в приложении</span></label>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.desktopNotifications)} onChange={() => toggleField('desktopNotifications')} /><span>Разрешить уведомления рабочего стола</span></label>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.soundEnabled)} onChange={() => toggleField('soundEnabled')} /><span>Включить звуки событий</span></label>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.compactMode)} onChange={() => toggleField('compactMode')} /><span>Компактный режим интерфейса</span></label>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.enterToSend)} onChange={() => toggleField('enterToSend')} /><span>Отправлять сообщение клавишей Enter</span></label>
        </section>

        <section className="card elevated stack">
          <strong>Внешний вид и доступность</strong>
          <label className="field">
            <span>Тема</span>
            <select className="select-inline" value={settings.theme || 'dark'} onChange={(e) => setSettings((current) => ({ ...current, theme: e.target.value }))}>
              <option value="dark">Тёмная</option>
              <option value="light">Светлая</option>
              <option value="system">Системная</option>
            </select>
          </label>
          <label className="field">
            <span>Масштаб шрифта</span>
            <select className="select-inline" value={settings.fontScale || 'normal'} onChange={(e) => setSettings((current) => ({ ...current, fontScale: e.target.value }))}>
              <option value="small">Мелкий</option>
              <option value="normal">Стандартный</option>
              <option value="large">Крупный</option>
            </select>
          </label>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.highContrast)} onChange={() => toggleField('highContrast')} /><span>Высокий контраст</span></label>
          <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.reduceMotion)} onChange={() => toggleField('reduceMotion')} /><span>Снизить анимацию интерфейса</span></label>
        </section>
      </div>

      <section className="card elevated stack">
        <strong>Настройки голоса</strong>
        <div className="split-grid responsive-stack">
          <label className="field">
            <span>Устройство ввода</span>
            <input className="input" value={inputValue(settings.voiceInputDevice)} onChange={(e) => setSettings((current) => ({ ...current, voiceInputDevice: e.target.value }))} placeholder="Например: USB-микрофон" />
          </label>
          <label className="field">
            <span>Устройство вывода</span>
            <input className="input" value={inputValue(settings.voiceOutputDevice)} onChange={(e) => setSettings((current) => ({ ...current, voiceOutputDevice: e.target.value }))} placeholder="Например: Гарнитура" />
          </label>
        </div>
        <label className="toggle-row"><input type="checkbox" checked={Boolean(settings.pushToTalk)} onChange={() => toggleField('pushToTalk')} /><span>Использовать push-to-talk для голоса</span></label>
        <div className="row wrap">
          <button className="button primary" disabled={state.busy} onClick={save}>{state.busy ? 'Сохраняем...' : 'Сохранить настройки'}</button>
          <button className="button ghost" onClick={() => setTheme((settings.theme || 'dark') === 'light' ? 'light' : 'dark')}>Применить тему в shell</button>
        </div>
      </section>
    </div>
  );
}

function AdminCenterPage({ profile, onProfile }) {
  const { refreshRooms } = useShellState();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [overview, setOverview] = useState(null);
  const [usersPayload, setUsersPayload] = useState({ users: [], departments: [], invitations: [] });
  const [matrixPayload, setMatrixPayload] = useState({ roles: [], permissions: [] });
  const [audit, setAudit] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [userDrafts, setUserDrafts] = useState({});
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member', note: '', expiresDays: 14 });
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '', leaderUserId: '', createBaseRooms: true });
  const [roomForm, setRoomForm] = useState({ name: '', kind: 'group', isPrivate: false, ownerUserId: '', memberIds: [], moderatorIds: [] });
  const [brandingForm, setBrandingForm] = useState({ appName: 'Контур Связи', organizationName: 'IT Group Company', organizationInn: '', licensePlan: 'Корпоративный пакет · 100 пользователей', supportLabel: 'Техническая поддержка', supportEmail: 'support@kontur.local', releaseLabel: '17.17.0 operator-wallboard', footerMark: 'Единый корпоративный контур связи, собраний и администрирования' });
  const [announcementForm, setAnnouncementForm] = useState({ isActive: false, level: 'info', title: '', message: '', activeUntil: '', scope: 'all' });
  const [auditFilter, setAuditFilter] = useState('');

  const tabs = [
    { key: 'overview', label: 'Обзор' },
    { key: 'users', label: 'Пользователи' },
    { key: 'rooms', label: 'Комнаты' },
    { key: 'departments', label: 'Отделы' },
    { key: 'roles', label: 'Роли и сессии' },
    { key: 'audit', label: 'Аудит' },
    { key: 'system', label: 'Система' }
  ];

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [overviewData, usersData, matrixData, auditData, incidentsData, roomsData, sessionsData, invitationsData, systemData] = await Promise.all([
        api.adminOverview(),
        api.adminUsers(),
        api.adminRolesMatrix(),
        api.audit(),
        api.adminIncidents(),
        api.adminRooms(),
        api.adminSessions(),
        api.adminInvitations(),
        api.adminSystem()
      ]);
      setOverview(overviewData);
      setUsersPayload(usersData);
      setMatrixPayload(matrixData);
      setAudit(auditData);
      setIncidents(incidentsData);
      setRooms(roomsData);
      setSessions(sessionsData);
      setInvitations(invitationsData);
      setSystemSettings(systemData);
      setBrandingForm(systemData || brandingForm);
      setAnnouncementForm(systemData?.announcement || { isActive: false, level: 'info', title: '', message: '', activeUntil: '', scope: 'all' });
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить административный контур.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (!hasPermission(profile, 'admin.access')) {
    return <AccessDeniedPage title="Центр администратора недоступен" message="Для этого раздела требуется роль администратора или выше." />;
  }

  function getUserDraft(user) {
    return userDrafts[user.id] || {
      displayName: user.displayName || '',
      role: user.role || 'member',
      status: user.status || 'online',
      isActive: user.isActive !== false,
      departmentId: user.departmentId || '',
      jobTitle: user.jobTitle || '',
      phone: user.phone || '',
      about: user.about || ''
    };
  }

  function updateUserDraft(userId, patch) {
    setUserDrafts((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] || {}),
        ...patch
      }
    }));
  }

  async function saveUser(userId) {
    setNotice('');
    setError('');
    try {
      await api.adminUpdateUser(userId, getUserDraft({ id: userId, ...(usersPayload.users.find((item) => item.id === userId) || {}) }));
      await loadAll();
      if (profile?.id === userId) {
        const me = await api.me();
        authStorage.setSession({ user: me });
        onProfile?.(me);
      }
      setNotice('Изменения по сотруднику сохранены.');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить сотрудника.'));
    }
  }

  async function revokeUserSessions(userId) {
    setNotice('');
    setError('');
    try {
      await api.adminRevokeUserSessions(userId);
      await loadAll();
      setNotice('Все сессии сотрудника завершены.');
    } catch (err) {
      setError(extractError(err, 'Не удалось завершить сессии сотрудника.'));
    }
  }

  async function createInvitation() {
    setNotice('');
    setError('');
    try {
      const created = await api.adminCreateInvitation(inviteForm);
      await loadAll();
      setInviteForm({ email: '', role: 'member', note: '', expiresDays: 14 });
      setNotice(`Приглашение создано: ${created.inviteLink}`);
    } catch (err) {
      setError(extractError(err, 'Не удалось создать приглашение.'));
    }
  }

  async function createDepartment() {
    setNotice('');
    setError('');
    try {
      await api.adminCreateDepartment(departmentForm);
      await loadAll();
      await refreshRooms();
      setDepartmentForm({ name: '', code: '', leaderUserId: '', createBaseRooms: true });
      setNotice('Отдел создан, базовые комнаты подготовлены.');
    } catch (err) {
      setError(extractError(err, 'Не удалось создать отдел.'));
    }
  }

  async function createRoom() {
    setNotice('');
    setError('');
    try {
      await api.adminCreateRoom(roomForm);
      await loadAll();
      await refreshRooms();
      setRoomForm({ name: '', kind: 'group', isPrivate: false, ownerUserId: '', memberIds: [], moderatorIds: [] });
      setNotice('Комната создана и добавлена в рабочий контур.');
    } catch (err) {
      setError(extractError(err, 'Не удалось создать комнату.'));
    }
  }

  async function archiveRoom(roomId) {
    setNotice('');
    setError('');
    try {
      await api.adminArchiveRoom(roomId);
      await loadAll();
      await refreshRooms();
      setNotice('Комната архивирована и убрана из рабочего списка.');
    } catch (err) {
      setError(extractError(err, 'Не удалось архивировать комнату.'));
    }
  }

  async function saveSystem() {
    setNotice('');
    setError('');
    try {
      const updated = await api.adminUpdateSystem(brandingForm);
      setSystemSettings(updated);
      const me = await api.me();
      authStorage.setSession({ user: me });
      onProfile?.(me);
      setNotice('Параметры бренда и лицензионного контура сохранены.');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить системные параметры.'));
    }
  }

  async function saveAnnouncement() {
    setNotice('');
    setError('');
    try {
      const updated = await api.adminUpdateAnnouncement(announcementForm);
      setSystemSettings((current) => ({ ...(current || {}), announcement: updated }));
      const me = await api.me();
      authStorage.setSession({ user: me });
      onProfile?.(me);
      setNotice('Системное объявление сохранено и опубликовано в shell.');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить системное объявление.'));
    }
  }

  async function clearAnnouncement() {
    setNotice('');
    setError('');
    try {
      const updated = await api.adminClearAnnouncement();
      setAnnouncementForm(updated || { isActive: false, level: 'info', title: '', message: '', activeUntil: '', scope: 'all' });
      setSystemSettings((current) => ({ ...(current || {}), announcement: updated }));
      const me = await api.me();
      authStorage.setSession({ user: me });
      onProfile?.(me);
      setNotice('Системное объявление снято.');
    } catch (err) {
      setError(extractError(err, 'Не удалось снять системное объявление.'));
    }
  }


  async function acknowledgeIncident(incidentId) {
    setNotice('');
    setError('');
    try {
      await api.adminAcknowledgeIncident(incidentId);
      await loadAll();
      setNotice('Инцидент отмечен как обработанный.');
    } catch (err) {
      setError(extractError(err, 'Не удалось отметить инцидент как обработанный.'));
    }
  }

  function toggleRoomMulti(field, userId) {
    setRoomForm((current) => {
      const exists = current[field].includes(userId);
      return {
        ...current,
        [field]: exists ? current[field].filter((item) => item !== userId) : [...current[field], userId]
      };
    });
  }

  const filteredAudit = audit.filter((item) => {
    if (!auditFilter.trim()) return true;
    const needle = auditFilter.toLowerCase();
    return [item.action, item.target, item.result, JSON.stringify(item.meta || {})].join(' ').toLowerCase().includes(needle);
  });

  const activeSessionsCount = sessions.filter((item) => !item.revokedAt && new Date(item.expiresAt).getTime() > Date.now()).length;
  const archivedRoomsCount = rooms.filter((item) => item.isArchived).length;

  return (
    <div className="stack-lg">
      <section className="hero-banner glass">
        <div>
          <div className="eyebrow">Единый центр администратора</div>
          <h2 className="section-title">Тот же shell, тот же визуальный контур, отдельная административная вкладка</h2>
          <div className="muted">Админка не ломает рабочий поток сотрудников: это отдельный раздел в общем интерфейсе с теми же паттернами, но с усиленным управлением пользователями, комнатами, ролями, аудитом и системой.</div>
        </div>
        <div className="stats-grid four">
          <StatCard label="Пользователи" value={overview?.users?.totalUsers || 0} subtext="Всего в контуре" accent={true} />
          <StatCard label="Комнаты" value={overview?.rooms?.totalRooms || 0} subtext="Активные рабочие комнаты" />
          <StatCard label="Приглашения" value={overview?.invitations?.active || 0} subtext="Активные ссылки" />
          <StatCard label="Сессии" value={overview?.sessions?.active || 0} subtext="Живые подключения" />
        </div>
      </section>

      <div className="tab-row glass">
        {tabs.map((item) => (
          <button key={item.key} className={cls('tab-chip', tab === item.key && 'active')} onClick={() => setTab(item.key)}>{item.label}</button>
        ))}
      </div>

      {loading ? <div className="card elevated">Загрузка административного контура...</div> : null}
      {error ? <div className="notice danger">{error}</div> : null}
      {notice ? <div className="notice success">{notice}</div> : null}

      {!loading && tab === 'overview' ? (
        <div className="stack-lg">
          <section className="split-grid responsive-stack admin-overview-grid">
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Состояние системы</strong><span className="pill">{systemSettings?.releaseLabel || '17.17.0 operator-wallboard'}</span></div>
              <div className="meta-grid wide">
                <span className="meta-item">{systemSettings?.appName || 'CorpChat'}</span>
                <span className="meta-item">{systemSettings?.organizationName || 'IT Group Company'}</span>
                <span className="meta-item">Пакет: {systemSettings?.licensePlan || '15 пользователей'}</span>
                <span className="meta-item">Архивных комнат: {archivedRoomsCount}</span>
                <span className="meta-item">Объявление: {systemSettings?.announcement?.isActive ? 'активно' : 'не активно'}</span>
              </div>
            </div>
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Фокус понедельника</strong><span className="pill pill-accent">Приоритет</span></div>
              <div className="feature-list compact-list">
                <div className="feature-row">Живые комнаты без пустых экранов</div>
                <div className="feature-row">Голос с участниками, ролями и модерацией</div>
                <div className="feature-row">Отдельный административный центр без ломки shell</div>
                <div className="feature-row">Управление доступом, приглашениями и сессиями</div>
              </div>
            </div>
          </section>

          <section className="split-grid responsive-stack">
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Ключевые сотрудники</strong><span className="pill">{overview?.spotlightUsers?.length || 0}</span></div>
              <div className="member-list compact">
                {(overview?.spotlightUsers || []).map((user) => (
                  <div className="member-row" key={user.id}>
                    <div className="user-avatar small">{initials(user.displayName)}</div>
                    <div className="stack-xs fill">
                      <strong>{user.displayName}</strong>
                      <div className="muted small">{roleLabel(user.role)} · {user.departmentName || 'Без отдела'} · {statusLabel(user.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Последние события аудита</strong><span className="pill">{audit.length}</span></div>
              <div className="audit-list compact-list">
                {audit.slice(0, 8).map((item) => (
                  <div className="audit-row card elevated" key={item.id}>
                    <div className="audit-main"><strong>{item.action}</strong><div className="muted small">{item.target || 'Без цели'}</div></div>
                    <div className="audit-result">{item.result}</div>
                    <div className="muted small">{formatDateTime(item.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="split-grid responsive-stack">
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Launch-board · активные голосовые комнаты</strong><span className="pill">{overview?.launchBoard?.activeVoiceRooms?.length || 0}</span></div>
              <div className="list-rail">
                {(overview?.launchBoard?.activeVoiceRooms || []).map((room) => (
                  <div className="mini-item" key={room.id}>
                    <strong>{room.name}</strong>
                    <span className="muted small">{roomKindLabel(room.kind)} · в голосе: {room.connectedVoiceCount || 0} · руки: {room.raisedHandsCount || 0}</span>
                  </div>
                ))}
                {!overview?.launchBoard?.activeVoiceRooms?.length ? <div className="muted small">Активные голосовые комнаты появятся после первого живого подключения.</div> : null}
              </div>
            </div>
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Очереди входа и собрания</strong><span className="pill">{(overview?.launchBoard?.pendingQueues?.length || 0) + (overview?.launchBoard?.meetings?.length || 0)}</span></div>
              <div className="list-rail">
                {(overview?.launchBoard?.pendingQueues || []).map((room) => (
                  <div className="mini-item" key={`queue-${room.id}`}>
                    <strong>{room.name}</strong>
                    <span className="muted small">Заявок на вход: {room.pendingJoinRequestsCount || 0}</span>
                  </div>
                ))}
                {(overview?.launchBoard?.meetings || []).map((room) => (
                  <div className="mini-item" key={`meeting-${room.id}`}>
                    <strong>{room.name}</strong>
                    <span className="muted small">{room.status === 'active' ? 'Идёт сейчас' : room.status === 'closed' ? 'Завершено' : 'Запланировано'} · ведущий: {room.hostName} · присутствуют: {room.presentCount || 0}</span>
                  </div>
                ))}
                {!overview?.launchBoard?.pendingQueues?.length && !overview?.launchBoard?.meetings?.length ? <div className="muted small">Контроль очередей и собраний появится после первых живых сценариев.</div> : null}
              </div>
            </div>
          </section>

          <section className="split-grid responsive-stack">
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Launch-monitor · открытые инциденты</strong><span className="pill">{overview?.launchMonitor?.summary?.openTotal || 0}</span></div>
              <div className="meta-grid wide">
                <span className="meta-item">Критичных: {overview?.launchMonitor?.summary?.criticalOpen || 0}</span>
                <span className="meta-item">Последний инцидент: {formatDateTime(overview?.launchMonitor?.summary?.lastIncidentAt)}</span>
              </div>
              <div className="list-rail">
                {(overview?.launchMonitor?.recentIncidents || []).map((item) => (
                  <div className="mini-item stack-xs" key={item.id}>
                    <div className="row between">
                      <strong>{item.roomName}</strong>
                      <span className={cls('pill', item.severity === 'critical' && 'pill-danger', item.severity === 'warning' && 'pill-accent')}>{incidentSeverityLabel(item.severity)}</span>
                    </div>
                    <span className="muted small">{incidentTypeLabel(item.incidentType)}{item.targetDisplayName ? ` · ${item.targetDisplayName}` : ''}</span>
                    <span className="muted small">{formatDateTime(item.createdAt)}</span>
                    {item.note ? <span className="muted small pre-wrap">{item.note}</span> : null}
                    <div className="row wrap">
                      <button className="button ghost small" onClick={() => acknowledgeIncident(item.id)}>Отметить обработанным</button>
                      <button className="button primary small" onClick={() => resolveIncident(item.id)}>Закрыть инцидент</button>
                    </div>
                  </div>
                ))}
                {!overview?.launchMonitor?.recentIncidents?.length ? <div className="muted small">Открытых инцидентов по комнатам сейчас нет.</div> : null}
              </div>
            </div>
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Горячие комнаты</strong><span className="pill">{overview?.launchMonitor?.hotRooms?.length || 0}</span></div>
              <div className="list-rail">
                {(overview?.launchMonitor?.hotRooms || []).map((room) => (
                  <div className="mini-item stack-xs" key={room.id}>
                    <strong>{room.name}</strong>
                    <span className="muted small">Инцидентов: {room.openIncidentsCount || 0}{room.criticalIncidentsCount ? ` · критичных: ${room.criticalIncidentsCount}` : ''} · заявок: {room.pendingJoinRequestsCount || 0} · в голосе: {room.connectedVoiceCount || 0}</span>
                    <div className="row wrap">
                      <button className="button ghost small" onClick={() => navigate(room.kind === 'meeting' ? `/app/meetings/${room.id}` : `/app/voice/${room.id}`)}>Открыть комнату</button>
                      <button className="button ghost small" onClick={() => runOperatorAction(room.id, 'set_entry_knock')}>По запросу</button>
                      <button className="button danger small" onClick={() => runOperatorAction(room.id, 'set_entry_closed')}>Закрыть вход</button>
                    </div>
                  </div>
                ))}
                {!overview?.launchMonitor?.hotRooms?.length ? <div className="muted small">Горячие комнаты появятся после первых живых инцидентов или очередей.</div> : null}
              </div>
            </div>


          <section className="card elevated stack-sm">
            <div className="section-row compact"><strong>Operator wallboard · быстрые действия</strong><span className="pill">{overview?.operatorWallboard?.summary?.trackedRooms || 0}</span></div>
            <div className="meta-grid wide">
              <span className="meta-item">Закрыт вход: {overview?.operatorWallboard?.summary?.closedRooms || 0}</span>
              <span className="meta-item">По запросу: {overview?.operatorWallboard?.summary?.knockRooms || 0}</span>
              <span className="meta-item">Открытых инцидентов: {overview?.operatorWallboard?.summary?.openIncidents || 0}</span>
              <span className="meta-item">Ожидают входа: {overview?.operatorWallboard?.summary?.pendingJoinRequests || 0}</span>
            </div>
            <div className="list-rail">
              {(overview?.operatorWallboard?.rooms || []).map((room) => (
                <div className="mini-item stack-xs" key={`op-${room.id}`}>
                  <div className="row between">
                    <strong>{room.name}</strong>
                    <span className="pill">{voiceEntryModeLabel(room.entryMode)}</span>
                  </div>
                  <span className="muted small">{roomKindLabel(room.kind)} · в голосе: {room.connectedVoiceCount || 0} · руки: {room.raisedHandsCount || 0} · заявок: {room.pendingJoinRequestsCount || 0}</span>
                  <div className="row wrap">
                    <button className="button ghost small" onClick={() => navigate(room.kind === 'meeting' ? `/app/meetings/${room.id}` : `/app/voice/${room.id}`)}>Открыть</button>
                    <button className="button ghost small" onClick={() => runOperatorAction(room.id, 'set_entry_open')}>Свободный</button>
                    <button className="button ghost small" onClick={() => runOperatorAction(room.id, 'set_entry_knock')}>По запросу</button>
                    <button className="button danger small" onClick={() => runOperatorAction(room.id, 'set_entry_closed')}>Закрыть</button>
                    <button className="button ghost small" onClick={() => runOperatorAction(room.id, 'mute_all')}>Mute всем</button>
                    <button className="button ghost small" onClick={() => runOperatorAction(room.id, 'lower_all_hands')}>Сбросить руки</button>
                    <button className="button danger small" onClick={() => runOperatorAction(room.id, 'disconnect_all')}>Отключить всех</button>
                  </div>
                </div>
              ))}
              {!overview?.operatorWallboard?.rooms?.length ? <div className="muted small">Operator wallboard заполнится после первых живых подключений и модерации.</div> : null}
            </div>
          </section>
          </section>
        </div>
      ) : null}

      {!loading && tab === 'users' ? (
        <div className="stack-lg">
          <section className="split-grid responsive-stack">
            <div className="card elevated stack">
              <div className="section-row compact"><strong>Приглашение сотрудника</strong><span className="pill">Внутренний доступ</span></div>
              <label className="field"><span>Рабочая почта</span><input className="input" value={inviteForm.email} onChange={(e) => setInviteForm((current) => ({ ...current, email: e.target.value }))} /></label>
              <label className="field"><span>Роль</span><select className="select-inline" value={inviteForm.role} onChange={(e) => setInviteForm((current) => ({ ...current, role: e.target.value }))}>{Object.keys(permissionMatrix).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
              <label className="field"><span>Примечание</span><input className="input" value={inviteForm.note} onChange={(e) => setInviteForm((current) => ({ ...current, note: e.target.value }))} /></label>
              <label className="field"><span>Срок действия, дней</span><input className="input" type="number" min="1" max="60" value={inviteForm.expiresDays} onChange={(e) => setInviteForm((current) => ({ ...current, expiresDays: Number(e.target.value || 14) }))} /></label>
              <button className="button primary" onClick={createInvitation}>Создать приглашение</button>
            </div>
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Активные приглашения</strong><span className="pill">{invitations.filter((item) => !item.acceptedAt).length}</span></div>
              <div className="feature-list compact-list">
                {invitations.slice(0, 12).map((item) => (
                  <div className="feature-row stack-xs" key={item.id}>
                    <strong>{item.email}</strong>
                    <div className="muted small">{roleLabel(item.role)} · {item.acceptedAt ? 'Принято' : 'Ожидает активации'} · до {formatDateTime(item.expiresAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card elevated stack">
            <div className="section-row compact"><strong>Сотрудники и роли</strong><span className="pill">{usersPayload.users.length}</span></div>
            <div className="table-like admin-user-list">
              {usersPayload.users.map((user) => {
                const draft = getUserDraft(user);
                return (
                  <div key={user.id} className="admin-user-card card elevated stack-sm">
                    <div className="section-row compact">
                      <div>
                        <strong>{user.displayName}</strong>
                        <div className="muted small">{user.email} · {user.departmentName || 'Без отдела'}</div>
                      </div>
                      <div className="row wrap">
                        <span className="pill">{roleLabel(user.role)}</span>
                        {!user.isActive ? <span className="pill pill-danger">Отключён</span> : null}
                      </div>
                    </div>
                    <div className="form-grid two">
                      <label className="field"><span>ФИО</span><input className="input" value={draft.displayName} onChange={(e) => updateUserDraft(user.id, { displayName: e.target.value })} /></label>
                      <label className="field"><span>Должность</span><input className="input" value={draft.jobTitle || ''} onChange={(e) => updateUserDraft(user.id, { jobTitle: e.target.value })} /></label>
                      <label className="field"><span>Роль</span><select className="select-inline" value={draft.role} onChange={(e) => updateUserDraft(user.id, { role: e.target.value })}>{Object.keys(permissionMatrix).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
                      <label className="field"><span>Статус</span><select className="select-inline" value={draft.status} onChange={(e) => updateUserDraft(user.id, { status: e.target.value })}><option value="online">В сети</option><option value="away">Отошёл</option><option value="busy">Занят</option><option value="offline">Не в сети</option></select></label>
                      <label className="field"><span>Отдел</span><select className="select-inline" value={draft.departmentId || ''} onChange={(e) => updateUserDraft(user.id, { departmentId: e.target.value })}><option value="">Без отдела</option>{usersPayload.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
                      <label className="field"><span>Активен</span><select className="select-inline" value={draft.isActive ? 'yes' : 'no'} onChange={(e) => updateUserDraft(user.id, { isActive: e.target.value === 'yes' })}><option value="yes">Да</option><option value="no">Нет</option></select></label>
                    </div>
                    <div className="row wrap">
                      <button className="button primary" onClick={() => saveUser(user.id)}>Сохранить сотрудника</button>
                      <button className="button ghost" onClick={() => revokeUserSessions(user.id)}>Завершить сессии</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {!loading && tab === 'rooms' ? (
        <div className="stack-lg">
          <section className="split-grid responsive-stack">
            <div className="card elevated stack">
              <div className="section-row compact"><strong>Создание комнаты</strong><span className="pill">Без ломки shell</span></div>
              <label className="field"><span>Название комнаты</span><input className="input" value={roomForm.name} onChange={(e) => setRoomForm((current) => ({ ...current, name: e.target.value }))} /></label>
              <div className="form-grid two">
                <label className="field"><span>Тип</span><select className="select-inline" value={roomForm.kind} onChange={(e) => setRoomForm((current) => ({ ...current, kind: e.target.value }))}><option value="group">Текстовая комната</option><option value="voice">Голосовая комната</option><option value="meeting">Комната для собраний</option><option value="channel">Канал</option></select></label>
                <label className="field"><span>Приватность</span><select className="select-inline" value={roomForm.isPrivate ? 'private' : 'public'} onChange={(e) => setRoomForm((current) => ({ ...current, isPrivate: e.target.value === 'private' }))}><option value="public">Общая</option><option value="private">Приватная</option></select></label>
              </div>
              <label className="field"><span>Владелец / ведущий</span><select className="select-inline" value={roomForm.ownerUserId} onChange={(e) => setRoomForm((current) => ({ ...current, ownerUserId: e.target.value }))}><option value="">Не выбран</option>{usersPayload.users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label>
              <div className="stack-sm">
                <span className="muted small">Участники комнаты</span>
                <div className="checkbox-grid">
                  {usersPayload.users.map((user) => (
                    <label key={user.id} className="check-chip"><input type="checkbox" checked={roomForm.memberIds.includes(user.id)} onChange={() => toggleRoomMulti('memberIds', user.id)} /> <span>{user.displayName}</span></label>
                  ))}
                </div>
              </div>
              {roomForm.kind !== 'group' ? (
                <div className="stack-sm">
                  <span className="muted small">Модераторы голоса / собрания</span>
                  <div className="checkbox-grid">
                    {usersPayload.users.map((user) => (
                      <label key={user.id} className="check-chip"><input type="checkbox" checked={roomForm.moderatorIds.includes(user.id)} onChange={() => toggleRoomMulti('moderatorIds', user.id)} /> <span>{user.displayName}</span></label>
                    ))}
                  </div>
                </div>
              ) : null}
              <button className="button primary" onClick={createRoom}>Создать комнату</button>
            </div>

            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Активные комнаты</strong><span className="pill">{rooms.filter((item) => !item.isArchived).length}</span></div>
              <div className="table-like">
                {rooms.map((room) => (
                  <div className="table-row" key={room.id}>
                    <div className="table-main">
                      <strong>{room.name}</strong>
                      <div className="muted small">{roomKindLabel(room.kind)} · участников: {room.membersCount || 0}{room.meetingStatus ? ` · собрание: ${room.meetingStatus}` : ''}</div>
                    </div>
                    <div className="row wrap align-center">
                      {room.isArchived ? <span className="pill pill-danger">Архив</span> : <button className="button ghost small" onClick={() => archiveRoom(room.id)}>Архивировать</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!loading && tab === 'departments' ? (
        <div className="stack-lg">
          <section className="split-grid responsive-stack">
            <div className="card elevated stack">
              <div className="section-row compact"><strong>Создание отдела</strong><span className="pill">Автоматизация</span></div>
              <label className="field"><span>Название</span><input className="input" value={departmentForm.name} onChange={(e) => setDepartmentForm((current) => ({ ...current, name: e.target.value }))} /></label>
              <div className="form-grid two">
                <label className="field"><span>Код</span><input className="input" value={departmentForm.code} onChange={(e) => setDepartmentForm((current) => ({ ...current, code: e.target.value }))} /></label>
                <label className="field"><span>Руководитель</span><select className="select-inline" value={departmentForm.leaderUserId} onChange={(e) => setDepartmentForm((current) => ({ ...current, leaderUserId: e.target.value }))}><option value="">Не выбран</option>{usersPayload.users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label>
              </div>
              <label className="check-chip"><input type="checkbox" checked={departmentForm.createBaseRooms} onChange={(e) => setDepartmentForm((current) => ({ ...current, createBaseRooms: e.target.checked }))} /> <span>Сразу создать базовые текстовую, голосовую и комнату собраний</span></label>
              <button className="button primary" onClick={createDepartment}>Создать отдел</button>
            </div>

            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Отделы в контуре</strong><span className="pill">{usersPayload.departments.length}</span></div>
              <div className="feature-list compact-list">
                {usersPayload.departments.map((department) => (
                  <div className="feature-row stack-xs" key={department.id}>
                    <strong>{department.name}</strong>
                    <div className="muted small">Код: {department.code || '—'} · Руководитель: {department.leaderName || 'не назначен'} · Сотрудников: {department.membersCount || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!loading && tab === 'roles' ? (
        <div className="stack-lg">
          <section className="card elevated stack">
            <div className="section-row compact"><strong>Матрица ролей и прав</strong><span className="pill">{matrixPayload.roles.length}</span></div>
            <div className="matrix-grid">
              {matrixPayload.roles.map((role) => (
                <div key={role.role} className="card elevated stack-sm">
                  <div className="section-row compact"><strong>{role.label}</strong><span className="pill">{role.permissionsCount}</span></div>
                  <div className="meta-grid wide">{role.permissions.map((permission) => <span className="meta-item" key={permission}>{permission}</span>)}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="card elevated stack">
            <div className="section-row compact"><strong>Сессии сотрудников</strong><span className="pill">{activeSessionsCount}</span></div>
            <div className="audit-list">
              {sessions.slice(0, 80).map((session) => (
                <div className="audit-row card elevated" key={session.id}>
                  <div className="audit-main"><strong>{session.displayName}</strong><div className="muted small">{session.email} · {roleLabel(session.role)}</div></div>
                  <div className="muted small">{sessionDeviceLabel(session)}</div>
                  <div className="audit-result">{session.revokedAt ? 'Завершена' : 'Активна'}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {!loading && tab === 'audit' ? (
        <div className="stack-lg">
          <section className="card elevated stack">
            <div className="section-row compact"><strong>Аудит действий</strong><span className="pill">{filteredAudit.length}</span></div>
            <div className="input-wrap search-shell"><span>⌕</span><input className="search-input" placeholder="Фильтр по действию, цели или результату" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} /></div>
            <div className="audit-list">
              {filteredAudit.map((item) => (
                <div className="audit-row card elevated" key={item.id}>
                  <div className="audit-main">
                    <strong>{item.action}</strong>
                    <div className="muted small">{item.target || 'Без цели'} · {formatDateTime(item.createdAt)}</div>
                    {item.meta ? <div className="muted small">{JSON.stringify(item.meta)}</div> : null}
                  </div>
                  <div className="audit-result">{item.result}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {!loading && tab === 'system' ? (
        <div className="stack-lg">
          <section className="split-grid responsive-stack">
            <div className="card elevated stack">
              <div className="section-row compact"><strong>Параметры бренда и лицензии</strong><span className="pill">Видят все пользователи</span></div>
              <div className="form-grid two">
                <label className="field"><span>Название программы</span><input className="input" value={brandingForm.appName} onChange={(e) => setBrandingForm((current) => ({ ...current, appName: e.target.value }))} /></label>
                <label className="field"><span>Организация</span><input className="input" value={brandingForm.organizationName} onChange={(e) => setBrandingForm((current) => ({ ...current, organizationName: e.target.value }))} /></label>
                <label className="field"><span>ИНН организации</span><input className="input" value={brandingForm.organizationInn || ''} onChange={(e) => setBrandingForm((current) => ({ ...current, organizationInn: e.target.value }))} /></label>
                <label className="field"><span>Лицензионный пакет</span><input className="input" value={brandingForm.licensePlan} onChange={(e) => setBrandingForm((current) => ({ ...current, licensePlan: e.target.value }))} /></label>
                <label className="field"><span>Поддержка</span><input className="input" value={brandingForm.supportLabel} onChange={(e) => setBrandingForm((current) => ({ ...current, supportLabel: e.target.value }))} /></label>
                <label className="field"><span>Почта поддержки</span><input className="input" value={brandingForm.supportEmail} onChange={(e) => setBrandingForm((current) => ({ ...current, supportEmail: e.target.value }))} /></label>
                <label className="field"><span>Марка релиза</span><input className="input" value={brandingForm.releaseLabel} onChange={(e) => setBrandingForm((current) => ({ ...current, releaseLabel: e.target.value }))} /></label>
              </div>
              <label className="field"><span>Подпись shell</span><textarea className="textarea" value={brandingForm.footerMark} onChange={(e) => setBrandingForm((current) => ({ ...current, footerMark: e.target.value }))} /></label>
              <button className="button primary" onClick={saveSystem}>Сохранить системные параметры</button>
            </div>
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Как это выглядит у пользователя</strong><span className="pill">Без отдельного чужого UI</span></div>
              <div className="feature-list compact-list">
                <div className="feature-row"><strong>{brandingForm.appName}</strong></div>
                <div className="feature-row">Организация: {brandingForm.organizationName}</div>
                {brandingForm.organizationInn ? <div className="feature-row">ИНН: {brandingForm.organizationInn}</div> : null}
                <div className="feature-row">Пакет: {brandingForm.licensePlan}</div>
                <div className="feature-row">{brandingForm.supportLabel}: {brandingForm.supportEmail}</div>
                <div className="feature-row">{brandingForm.footerMark}</div>
              </div>
            </div>
          </section>
          <section className="split-grid responsive-stack">
            <div className="card elevated stack">
              <div className="section-row compact"><strong>Системное объявление</strong><span className="pill">Показывается прямо в shell</span></div>
              <div className="form-grid two">
                <label className="field"><span>Заголовок</span><input className="input" value={announcementForm.title || ''} onChange={(e) => setAnnouncementForm((current) => ({ ...current, title: e.target.value }))} /></label>
                <label className="field"><span>Уровень</span><select className="select-inline" value={announcementForm.level || 'info'} onChange={(e) => setAnnouncementForm((current) => ({ ...current, level: e.target.value }))}><option value="info">Информация</option><option value="success">Успешно</option><option value="warning">Предупреждение</option><option value="danger">Критично</option></select></label>
                <label className="field"><span>Область</span><select className="select-inline" value={announcementForm.scope || 'all'} onChange={(e) => setAnnouncementForm((current) => ({ ...current, scope: e.target.value }))}><option value="all">Для всех</option><option value="admin">Только админы</option><option value="voice">Только голосовые комнаты</option><option value="meeting">Только собрания</option></select></label>
                <label className="field"><span>Действует до</span><input className="input" type="datetime-local" value={announcementForm.activeUntil ? String(announcementForm.activeUntil).slice(0, 16) : ''} onChange={(e) => setAnnouncementForm((current) => ({ ...current, activeUntil: e.target.value || null }))} /></label>
              </div>
              <label className="field"><span>Текст объявления</span><textarea className="textarea" value={announcementForm.message || ''} onChange={(e) => setAnnouncementForm((current) => ({ ...current, message: e.target.value }))} /></label>
              <label className="toggle-row"><input type="checkbox" checked={Boolean(announcementForm.isActive)} onChange={() => setAnnouncementForm((current) => ({ ...current, isActive: !current.isActive }))} /><span>Объявление активно и показывается пользователям</span></label>
              <div className="row wrap">
                <button className="button primary" onClick={saveAnnouncement}>Сохранить объявление</button>
                <button className="button ghost" onClick={clearAnnouncement}>Снять объявление</button>
              </div>
            </div>
            <div className="card elevated stack-sm">
              <div className="section-row compact"><strong>Предпросмотр объявления</strong><span className="pill">{announcementForm.isActive ? 'Активно' : 'Черновик'}</span></div>
              <div className={cls('card elevated announcement-banner', `announcement-${announcementForm.level || 'info'}`)}>
                <div className="stack-xs">
                  <strong>{announcementForm.title || 'Системное объявление'}</strong>
                  <div className="muted">{announcementForm.message || 'Текст объявления появится здесь.'}</div>
                  {announcementForm.activeUntil ? <div className="muted small">Действует до: {formatDateTime(announcementForm.activeUntil)}</div> : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ProfilePage({ profile, onProfile, theme, setTheme }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    jobTitle: profile?.jobTitle || '',
    phone: profile?.phone || '',
    about: profile?.about || '',
    status: profile?.status || 'online'
  });
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', error: '', success: '' });
  const [saving, setSaving] = useState(false);
  const [sessionSummary, setSessionSummary] = useState({ active: 0, history: 0, loading: true });

  useEffect(() => {
    api.me().then((data) => {
      onProfile(data);
      setForm({
        displayName: data.displayName || '',
        jobTitle: data.jobTitle || '',
        phone: data.phone || '',
        about: data.about || '',
        status: data.status || 'online'
      });
    }).catch(() => null);
    api.sessions()
      .then((data) => {
        setSessionSummary({
          active: data.sessions.filter((item) => !item.isRevoked && !item.isExpired).length,
          history: data.history.length,
          loading: false
        });
      })
      .catch(() => setSessionSummary({ active: 0, history: 0, loading: false }));
  }, [onProfile]);

  async function saveProfile() {
    setSaving(true);
    setSecurity((current) => ({ ...current, error: '', success: '' }));
    try {
      const updated = await api.updateMe(form);
      onProfile(updated);
      authStorage.setSession({ user: updated });
      setSecurity((current) => ({ ...current, success: 'Профиль сохранён.' }));
    } catch (error) {
      setSecurity((current) => ({ ...current, error: extractError(error, 'Не удалось сохранить профиль.') }));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setSecurity((current) => ({ ...current, error: '', success: '' }));
    try {
      await api.changePassword(security.currentPassword, security.newPassword);
      setSecurity((current) => ({ ...current, success: 'Пароль обновлён. Остальные сессии завершены автоматически.' }));
      setTimeout(async () => {
        try { await api.logout(authStorage.getRefreshToken()); } catch {}
        authStorage.clear();
        resetSocket();
        navigate('/');
      }, 900);
    } catch (error) {
      setSecurity((current) => ({ ...current, error: extractError(error, 'Не удалось сменить пароль.') }));
    }
  }

  return (
    <div className="stack-lg">
      <section className="hero-banner glass">
        <div>
          <div className="eyebrow">Профиль сотрудника</div>
          <h2 className="section-title">{profile?.displayName || profile?.email || 'Сотрудник'}</h2>
          <div className="muted">Этап 3 делает профиль отдельным модулем: реальные данные, активные комнаты, сессии и управление безопасностью.</div>
        </div>
        <div className="meta-grid wide">
          <span className="meta-item">{roleLabel(profile?.role)}</span>
          <span className="meta-item">{statusLabel(profile?.status)}</span>
          <span className="meta-item">{profile?.departmentName || 'Отдел не указан'}</span>
          <span className="meta-item">Сессий: {sessionSummary.loading ? '...' : sessionSummary.active}</span>
        </div>
      </section>

      <div className="split-grid responsive-stack">
        <section className="card elevated stack">
          <div className="profile-head">
            <div className="user-avatar xl">{initials(profile?.displayName || profile?.email)}</div>
            <div className="stack-xs">
              <strong>{profile?.displayName || 'Сотрудник'}</strong>
              <div className="muted">{profile?.jobTitle || 'Должность не указана'}</div>
              <div className="muted">{profile?.email || ''}</div>
              <div className="muted">{profile?.phone || 'Телефон не указан'} · {profile?.departmentName || 'Без отдела'}</div>
            </div>
          </div>
          <label className="field"><span>ФИО</span><input className="input" value={form.displayName} onChange={(e) => setForm((current) => ({ ...current, displayName: e.target.value }))} /></label>
          <label className="field"><span>Должность</span><input className="input" value={inputValue(form.jobTitle)} onChange={(e) => setForm((current) => ({ ...current, jobTitle: e.target.value }))} /></label>
          <label className="field"><span>Телефон</span><input className="input" value={inputValue(form.phone)} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} /></label>
          <label className="field"><span>Статус</span><select className="select-inline" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}><option value="online">В сети</option><option value="away">Отошёл</option><option value="busy">Занят</option><option value="offline">Не в сети</option></select></label>
          <label className="field"><span>О себе</span><textarea className="textarea" value={inputValue(form.about)} onChange={(e) => setForm((current) => ({ ...current, about: e.target.value }))} /></label>
          <div className="row wrap">
            <button className="button primary" disabled={saving} onClick={saveProfile}>{saving ? 'Сохраняем...' : 'Сохранить профиль'}</button>
            <NavLink className="button ghost" to="/app/settings">Открыть настройки</NavLink>
          </div>
        </section>

        <section className="card elevated stack">
          <strong>Активные комнаты и доступ</strong>
          <div className="feature-list compact-list">
            {(profile?.rooms || []).map((room) => <div className="feature-row" key={room.id}><span>{roomIcon(room.kind)} {room.name} · {roomKindLabel(room.kind)}</span></div>)}
          </div>
          <div className="meta-grid wide">
            {(profile?.permissions || []).slice(0, 8).map((permission) => <span className="meta-item" key={permission}>{permission}</span>)}
          </div>
          <button className="button ghost" onClick={() => navigate('/app/sessions')}>Открыть сессии и входы</button>
        </section>
      </div>

      <section className="card elevated stack">
        <strong>Безопасность</strong>
        <input className="input" type="password" placeholder="Текущий пароль" value={security.currentPassword} onChange={(e) => setSecurity((current) => ({ ...current, currentPassword: e.target.value }))} />
        <input className="input" type="password" placeholder="Новый пароль" value={security.newPassword} onChange={(e) => setSecurity((current) => ({ ...current, newPassword: e.target.value }))} />
        {security.error ? <div className="notice danger">{security.error}</div> : null}
        {security.success ? <div className="notice success">{security.success}</div> : null}
        <div className="row wrap">
          <button className="button primary" onClick={changePassword}>Сменить пароль</button>
          <button className="button ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Переключить тему на {theme === 'dark' ? 'светлую' : 'тёмную'}</button>
        </div>
      </section>
    </div>
  );
}

function Protected({ profile, children }) {
  if (!authStorage.getAccessToken() && !profile) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const [profile, setProfile] = useState(authStorage.getProfile());
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem(THEME_STORAGE_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const settings = profile?.settings || {};
    document.documentElement.dataset.compact = settings.compactMode ? '1' : '0';
    document.documentElement.dataset.motion = settings.reduceMotion ? 'reduce' : 'normal';
    document.documentElement.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    document.documentElement.dataset.fontScale = settings.fontScale || 'normal';
    if (settings.theme === 'dark' || settings.theme === 'light') setTheme(settings.theme);
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, [profile?.settings?.theme, profile?.settings?.compactMode, profile?.settings?.reduceMotion, profile?.settings?.highContrast, profile?.settings?.fontScale]);

  useEffect(() => {
    const appName = profile?.system?.appName || 'Контур Связи';
    document.title = `${appName} — рабочий контур`;
  }, [profile]);

  useEffect(() => {
    bootstrapSession().finally(async () => {
      if (authStorage.getAccessToken()) {
        try {
          const me = await api.me();
          authStorage.setSession({ user: me });
          if (me?.settings?.theme && me.settings.theme !== 'system') setTheme(me.settings.theme);
          setProfile(me);
        } catch {
          authStorage.clear();
          setProfile(null);
        }
      }
      setReady(true);
    });
  }, []);

  async function logout() {
    try { await api.logout(authStorage.getRefreshToken()); } catch {}
    authStorage.clear();
    resetSocket();
    setProfile(null);
    window.location.href = '/';
  }

  if (!ready) {
    return <div className="standalone-layout"><div className="card elevated">Инициализация сессии...</div></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage onLogin={setProfile} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite" element={<InviteAcceptPage onLogin={setProfile} />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route
          path="/app/*"
          element={
            <Protected profile={profile}>
              <AppShell profile={profile} onLogout={logout} theme={theme} setTheme={setTheme}>
                <Routes>
                  <Route path="inbox" element={<InboxPage />} />
                  <Route path="rooms/:roomId" element={<RoomPage profile={profile} />} />
                  <Route path="voice/:roomId" element={<VoiceRoomPage />} />
                  <Route path="meetings/:roomId" element={<MeetingRoomPage />} />
                  <Route path="profile" element={<PermissionGuard profile={profile} permission="profile.read" title="Профиль недоступен" message="Для просмотра профиля недостаточно прав."><ProfilePage profile={profile} onProfile={setProfile} theme={theme} setTheme={setTheme} /></PermissionGuard>} />
                  <Route path="settings" element={<PermissionGuard profile={profile} permission="settings.manage" title="Настройки недоступны" message="Для этого раздела нужна роль с правом управления настройками."><SettingsPage profile={profile} onProfile={setProfile} theme={theme} setTheme={setTheme} /></PermissionGuard>} />
                  <Route path="sessions" element={<SessionsPage onLogout={logout} />} />
                  <Route path="admin" element={<AdminCenterPage profile={profile} onProfile={setProfile} />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppShell>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
