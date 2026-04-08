export const roleLabels = {
  super_admin: 'Супер-администратор',
  admin: 'Администратор',
  leader: 'Руководитель',
  moderator: 'Модератор',
  member: 'Сотрудник',
  guest: 'Приглашённый',
  external: 'Внешний участник',
  blocked: 'Заблокированный'
};

export const permissionsCatalog = [
  { key: 'profile.read', title: 'Просмотр профиля', module: 'profile' },
  { key: 'profile.manage', title: 'Управление профилем сотрудника', module: 'profile' },
  { key: 'settings.manage', title: 'Управление личными настройками', module: 'settings' },
  { key: 'rooms.read', title: 'Просмотр комнат', module: 'rooms' },
  { key: 'rooms.create', title: 'Создание комнат', module: 'rooms' },
  { key: 'rooms.archive', title: 'Архивирование комнат', module: 'rooms' },
  { key: 'messages.write', title: 'Отправка сообщений', module: 'messages' },
  { key: 'messages.edit_own', title: 'Редактирование своих сообщений', module: 'messages' },
  { key: 'messages.delete_own', title: 'Удаление своих сообщений', module: 'messages' },
  { key: 'messages.moderate', title: 'Модерация сообщений и закрепов', module: 'messages' },
  { key: 'files.upload', title: 'Загрузка файлов', module: 'files' },
  { key: 'files.manage', title: 'Управление файлами', module: 'files' },
  { key: 'voice.join', title: 'Подключение к голосу', module: 'voice' },
  { key: 'voice.share_screen', title: 'Демонстрация экрана', module: 'voice' },
  { key: 'voice.moderate', title: 'Модерация голоса', module: 'voice' },
  { key: 'meetings.manage', title: 'Управление собраниями', module: 'meetings' },
  { key: 'admin.access', title: 'Доступ в центр администратора', module: 'admin' },
  { key: 'users.manage', title: 'Управление пользователями', module: 'admin' },
  { key: 'roles.manage', title: 'Управление ролями и правами', module: 'admin' },
  { key: 'audit.read', title: 'Просмотр аудита', module: 'admin' },
  { key: 'sessions.manage', title: 'Управление сессиями сотрудников', module: 'admin' },
  { key: 'system.manage', title: 'Управление системными настройками', module: 'admin' }
];

export const roleMatrix = {
  super_admin: permissionsCatalog.map((item) => item.key),
  admin: [
    'profile.read', 'profile.manage', 'settings.manage',
    'rooms.read', 'rooms.create', 'rooms.archive',
    'messages.write', 'messages.edit_own', 'messages.delete_own', 'messages.moderate',
    'files.upload', 'files.manage',
    'voice.join', 'voice.share_screen', 'voice.moderate',
    'meetings.manage',
    'admin.access', 'users.manage', 'roles.manage', 'audit.read', 'sessions.manage', 'system.manage'
  ],
  leader: [
    'profile.read', 'settings.manage', 'rooms.read', 'rooms.create',
    'messages.write', 'messages.edit_own', 'messages.delete_own',
    'files.upload', 'voice.join', 'voice.share_screen', 'meetings.manage'
  ],
  moderator: [
    'profile.read', 'settings.manage', 'rooms.read',
    'messages.write', 'messages.edit_own', 'messages.delete_own', 'messages.moderate',
    'files.upload', 'files.manage',
    'voice.join', 'voice.share_screen', 'voice.moderate'
  ],
  member: [
    'profile.read', 'settings.manage', 'rooms.read',
    'messages.write', 'messages.edit_own', 'messages.delete_own',
    'files.upload', 'voice.join'
  ],
  guest: ['profile.read', 'rooms.read', 'messages.write', 'voice.join'],
  external: ['profile.read', 'rooms.read', 'messages.write', 'voice.join'],
  blocked: []
};

export function getRolePermissions(role) {
  return roleMatrix[role] || [];
}

export function hasPermission(role, permission) {
  return getRolePermissions(role).includes(permission);
}

export function getMatrixView() {
  return Object.entries(roleMatrix).map(([role, permissions]) => ({
    role,
    label: roleLabels[role] || role,
    permissions,
    permissionsCount: permissions.length
  }));
}
