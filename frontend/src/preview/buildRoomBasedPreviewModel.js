export const ROOM_BASED_ROLE_PRESETS = {
  admin: { name: 'Администратор', role: 'super_admin · Руководство', avatar: 'А' },
  leader: { name: 'Руководитель', role: 'leader · Продажи', avatar: 'Р' },
  moderator: { name: 'Модератор', role: 'moderator · Операции', avatar: 'М' },
  member: { name: 'Сотрудник', role: 'member · Поддержка', avatar: 'С' },
};

function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function firstLetter(value, fallback = '•') {
  return (value || '').trim().charAt(0).toUpperCase() || fallback;
}

function roomKind(kind) {
  if (kind === 'voice') return 'voice';
  if (kind === 'meeting') return 'meeting';
  return 'group';
}

function participantStatus(member, participants) {
  const match = asArray(participants).find((item) => String(item.userId || item.id) === String(member.id));
  if (!match) return { label: 'в комнате', tone: 'green' };
  if (match.handRaised) return { label: 'рука', tone: 'amber' };
  if (match.isMuted) return { label: 'без микрофона', tone: 'amber' };
  return { label: 'в голосе', tone: 'green' };
}

export function buildRoomBasedPreviewModel({
  user,
  roleView = 'admin',
  rooms = [],
  currentRoomId,
  messages = [],
  members = [],
  participants = [],
  incidentsCount = 1,
  pendingRequests = 0,
  nextMeetingTime = '14:00',
}) {
  const currentRoom = asArray(rooms).find((room) => String(room.id) === String(currentRoomId)) || asArray(rooms)[0] || null;
  const textRooms = asArray(rooms).filter((room) => !['voice', 'meeting'].includes(room.kind));
  const voiceRooms = asArray(rooms).filter((room) => room.kind === 'voice');
  const meetingRooms = asArray(rooms).filter((room) => room.kind === 'meeting');
  const rolePreset = ROOM_BASED_ROLE_PRESETS[roleView] || ROOM_BASED_ROLE_PRESETS.admin;

  const normalizedMessages = asArray(messages).slice(0, 8).map((message) => ({
    id: message.id,
    title: message.user?.name || message.author?.name || 'Пользователь',
    avatar: firstLetter(message.user?.name || message.author?.name || message.displayName),
    time: message.createdAt || message.created_at || message.timestamp || '',
    text: message.text || message.content || message.body || '',
  }));

  const normalizedMembers = asArray(members).map((member) => ({
    id: member.id,
    name: member.name || member.displayName || member.username || member.email || 'Пользователь',
    role: member.role || member.systemRole || member.email || 'member',
    avatar: firstLetter(member.name || member.displayName || member.username || member.email),
    status: participantStatus(member, participants),
  }));

  const activeVoiceRoom = voiceRooms[0] || null;
  const activeMeetingRoom = meetingRooms[0] || null;

  return {
    rolePreset,
    currentRoom,
    navRooms: [
      { key: 'dashboard', label: 'Главная', subtitle: 'Диспетчерская рабочего дня', icon: '⌂', kind: 'group' },
      ...(textRooms[0] ? [{ key: 'room', label: textRooms[0].name, subtitle: 'Текстовая комната', icon: '#', kind: 'group' }] : []),
      ...(activeVoiceRoom ? [{ key: 'voice', label: activeVoiceRoom.name, subtitle: 'Комната координации', icon: '◉', kind: 'voice' }] : []),
      ...(activeMeetingRoom ? [{ key: 'meeting', label: activeMeetingRoom.name, subtitle: 'Сценарий встречи', icon: '✦', kind: 'meeting' }] : []),
      { key: 'admin', label: 'Админ-центр', subtitle: 'Users · Rooms · Audit', icon: '⚙', kind: 'group' },
    ],
    dashboard: {
      activeRooms: rooms.length,
      voiceNow: participants.length,
      pendingRequests,
      incidentsCount,
      nextMeetingTime,
      activeRoomsList: [
        ...(textRooms[0] ? [{ name: textRooms[0].name, hint: 'Новые сообщения', value: `${normalizedMessages.length} в ленте`, tone: 'green' }] : []),
        ...(activeVoiceRoom ? [{ name: activeVoiceRoom.name, hint: 'Координация и SLA', value: `${participants.length} в голосе`, tone: 'amber' }] : []),
        ...(activeMeetingRoom ? [{ name: activeMeetingRoom.name, hint: 'Следующее собрание', value: nextMeetingTime, tone: 'default' }] : []),
      ],
    },
    roomFeed: normalizedMessages,
    roomMembers: normalizedMembers,
    voiceMembers: normalizedMembers,
    meeting: {
      title: activeMeetingRoom?.name || 'Зал собраний',
      nextMeetingTime,
      tabs: ['participants', 'agenda', 'materials', 'log', 'result'],
      agenda: [
        { title: 'Приём заявок и входной контур', hint: 'Проверить knock-mode и moderation path.' },
        { title: 'SLA и инциденты', hint: 'Снять текущий P1 и обновить wallboard.' },
        { title: 'Release contour', hint: 'Фиксация next steps по active baseline.' },
      ],
    },
    context: {
      baseline: 'room-based-v17',
      contour: 'single deploy path',
      domain: 'ai.voice.oboron-it.ru',
      runtimeStatus: 'runtime alive',
    },
    user: user || {
      id: 'preview-user',
      name: rolePreset.name,
      email: '',
      role: rolePreset.role,
    },
  };
}
