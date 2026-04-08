import { badRequest } from '../lib/errors.js';

const allowedRoles = new Set(['super_admin','admin','leader','moderator','member','guest','external','blocked']);
const allowedStatuses = new Set(['online','away','busy','offline']);
const allowedRoomKinds = new Set(['group','voice','meeting','channel','dm','stage']);

function text(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function bool(value, fallback = false) {
  if (value === undefined) return fallback;
  return Boolean(value);
}

function stringList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => text(item)).filter(Boolean))];
}

export function validateAdminUserUpdate(body) {
  const payload = {
    displayName: text(body?.displayName),
    role: text(body?.role),
    status: text(body?.status),
    isActive: body?.isActive === undefined ? undefined : Boolean(body.isActive),
    departmentId: text(body?.departmentId),
    jobTitle: text(body?.jobTitle),
    phone: text(body?.phone),
    about: text(body?.about)
  };

  if (payload.role && !allowedRoles.has(payload.role)) {
    throw badRequest('ROLE_INVALID', 'Некорректная роль', 'Указана неподдерживаемая роль пользователя.');
  }
  if (payload.status && !allowedStatuses.has(payload.status)) {
    throw badRequest('STATUS_INVALID', 'Некорректный статус', 'Указан неподдерживаемый статус пользователя.');
  }
  return payload;
}

export function validateAdminRoomCreate(body) {
  const name = text(body?.name);
  const kind = text(body?.kind) || 'group';
  if (!name) throw badRequest('ROOM_NAME_REQUIRED', 'Нужно название комнаты', 'Укажите название комнаты.');
  if (!allowedRoomKinds.has(kind)) {
    throw badRequest('ROOM_KIND_INVALID', 'Некорректный тип комнаты', 'Указан неподдерживаемый тип комнаты.');
  }
  return {
    name,
    kind,
    isPrivate: bool(body?.isPrivate, false),
    memberIds: stringList(body?.memberIds),
    ownerUserId: text(body?.ownerUserId),
    moderatorIds: stringList(body?.moderatorIds)
  };
}

export function validateDepartmentCreate(body) {
  const name = text(body?.name);
  if (!name) throw badRequest('DEPARTMENT_NAME_REQUIRED', 'Нужно название отдела', 'Укажите название отдела.');
  return {
    name,
    code: text(body?.code),
    leaderUserId: text(body?.leaderUserId),
    createBaseRooms: bool(body?.createBaseRooms, true)
  };
}

export function validateInvitationCreate(body) {
  const email = text(body?.email);
  const role = text(body?.role) || 'member';
  if (!email) throw badRequest('EMAIL_REQUIRED', 'Нужна почта сотрудника', 'Укажите рабочую почту приглашённого.');
  if (!allowedRoles.has(role)) throw badRequest('ROLE_INVALID', 'Некорректная роль', 'Указана неподдерживаемая роль пользователя.');
  return {
    email,
    role,
    note: text(body?.note),
    expiresDays: Number(body?.expiresDays || 14)
  };
}



const allowedOperatorActions = new Set(['set_entry_open','set_entry_knock','set_entry_closed','mute_all','unmute_all','lower_all_hands','stop_all_screens','disconnect_all']);

export function validateAdminOperatorAction(body) {
  const action = text(body?.action);
  if (!action || !allowedOperatorActions.has(action)) {
    throw badRequest('ADMIN_OPERATOR_ACTION_INVALID', 'Некорректное операторское действие', 'Поддерживаются set_entry_open, set_entry_knock, set_entry_closed, mute_all, unmute_all, lower_all_hands, stop_all_screens и disconnect_all.');
  }
  return { action, note: text(body?.note) };
}

export function validateBrandingPayload(body) {
  return {
    appName: text(body?.appName) || 'Контур Связи',
    organizationName: text(body?.organizationName) || 'IT Group Company',
    organizationInn: text(body?.organizationInn) || '',
    licensePlan: text(body?.licensePlan) || 'Корпоративный пакет · 100 пользователей',
    supportLabel: text(body?.supportLabel) || 'Техническая поддержка',
    supportEmail: text(body?.supportEmail) || 'support@kontur.local',
    releaseLabel: text(body?.releaseLabel) || 'V17',
    footerMark: text(body?.footerMark) || 'Единый корпоративный контур связи, собраний и администрирования'
  };
}


export function validateAnnouncementPayload(body) {
  const level = text(body?.level) || 'info';
  if (!['info', 'warning', 'danger', 'success'].includes(level)) {
    throw badRequest('ANNOUNCEMENT_LEVEL_INVALID', 'Некорректный уровень объявления', 'Используйте info, warning, danger или success.');
  }
  const title = text(body?.title);
  const message = text(body?.message);
  if (!title || !message) {
    throw badRequest('ANNOUNCEMENT_REQUIRED', 'Объявление заполнено не полностью', 'Укажите заголовок и текст объявления.');
  }
  const scope = text(body?.scope) || 'all';
  if (!['all', 'admin', 'voice', 'meeting'].includes(scope)) {
    throw badRequest('ANNOUNCEMENT_SCOPE_INVALID', 'Некорректная область объявления', 'Поддерживаются all, admin, voice и meeting.');
  }
  return {
    isActive: body?.isActive === undefined ? true : Boolean(body.isActive),
    level,
    title,
    message,
    activeUntil: text(body?.activeUntil),
    scope
  };
}
