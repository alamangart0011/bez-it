insert into departments (id, name, code)
values
('30000000-0000-0000-0000-000000000001','Администрация','ADMIN'),
('30000000-0000-0000-0000-000000000002','Проекты','PROJECTS'),
('30000000-0000-0000-0000-000000000003','Поддержка','SUPPORT')
on conflict do nothing;

insert into users (id, display_name, username, email, role, status, is_active, password_hash)
values
('00000000-0000-0000-0000-000000000001','Иван Петров','ipetrov','admin@corpchat.local','admin','online',true,'$2a$12$ifg6j70qMViy6ooXIuuZlukgmCvO2vN9WsWrxq96jPvHyPLouuCnu'),
('00000000-0000-0000-0000-000000000002','Мария Иванова','mivanova','maria@corpchat.local','member','online',true,'$2a$12$ifg6j70qMViy6ooXIuuZlukgmCvO2vN9WsWrxq96jPvHyPLouuCnu'),
('00000000-0000-0000-0000-000000000003','Олег Смирнов','osmirnov','leader@corpchat.local','leader','busy',true,'$2a$12$ifg6j70qMViy6ooXIuuZlukgmCvO2vN9WsWrxq96jPvHyPLouuCnu'),
('00000000-0000-0000-0000-000000000004','Анна Кузнецова','akuznetsova','anna@corpchat.local','moderator','online',true,'$2a$12$ifg6j70qMViy6ooXIuuZlukgmCvO2vN9WsWrxq96jPvHyPLouuCnu'),
('00000000-0000-0000-0000-000000000005','Павел Соколов','psokolov','pavel@corpchat.local','member','away',true,'$2a$12$ifg6j70qMViy6ooXIuuZlukgmCvO2vN9WsWrxq96jPvHyPLouuCnu')
on conflict do nothing;

update departments set leader_user_id = '00000000-0000-0000-0000-000000000001' where id = '30000000-0000-0000-0000-000000000001';
update departments set leader_user_id = '00000000-0000-0000-0000-000000000003' where id = '30000000-0000-0000-0000-000000000002';

insert into user_profiles (user_id, department_id, job_title, phone, about)
values
('00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Администратор корпоративного контура','+7 (900) 100-00-01','Отвечает за права, аудит и выпуск следующих редакций.'),
('00000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','Системный аналитик','+7 (900) 100-00-02','Ведёт продуктовые требования и наполнение рабочих комнат.'),
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','Руководитель проектного блока','+7 (900) 100-00-03','Координирует собрания, роли и статусы сотрудников.'),
('00000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003','Старший оператор смены','+7 (900) 100-00-04','Ведёт модерацию обращений и инцидентов поддержки.'),
('00000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000003','Инженер сопровождения','+7 (900) 100-00-05','Отвечает за обработку обращений пользователей в чате и голосе.')
on conflict (user_id) do nothing;

insert into user_settings (user_id, theme, notifications_enabled, sound_enabled, desktop_notifications, compact_mode, enter_to_send, push_to_talk, voice_input_device, voice_output_device, font_scale, high_contrast, reduce_motion)
values
('00000000-0000-0000-0000-000000000001','dark',true,true,true,false,true,false,'Основной микрофон','Основные наушники','normal',false,false),
('00000000-0000-0000-0000-000000000002','dark',true,true,true,true,true,false,'USB-микрофон','Встроенные динамики','normal',false,false),
('00000000-0000-0000-0000-000000000003','light',true,false,true,false,true,true,'Настольный микрофон','Конференц-гарнитура','large',false,true),
('00000000-0000-0000-0000-000000000004','dark',true,true,true,false,true,false,'Гарнитура оператора','Колонки оператора','normal',false,false),
('00000000-0000-0000-0000-000000000005','light',true,true,false,true,true,false,'USB-гарнитура','USB-гарнитура','normal',false,false)
on conflict (user_id) do nothing;

insert into permissions (key, title, module)
values
('profile.read','Просмотр профиля','profile'),
('profile.manage','Управление профилем сотрудника','profile'),
('settings.manage','Управление личными настройками','settings'),
('rooms.read','Просмотр комнат','rooms'),
('rooms.create','Создание комнат','rooms'),
('rooms.archive','Архивирование комнат','rooms'),
('messages.write','Отправка сообщений','messages'),
('messages.edit_own','Редактирование своих сообщений','messages'),
('messages.delete_own','Удаление своих сообщений','messages'),
('messages.moderate','Модерация сообщений и закрепов','messages'),
('files.upload','Загрузка файлов','files'),
('files.manage','Управление файлами','files'),
('voice.join','Подключение к голосу','voice'),
('voice.share_screen','Демонстрация экрана','voice'),
('voice.moderate','Модерация голоса','voice'),
('meetings.manage','Управление собраниями','meetings'),
('admin.access','Доступ в центр администратора','admin'),
('users.manage','Управление пользователями','admin'),
('roles.manage','Управление ролями и правами','admin'),
('audit.read','Просмотр аудита','admin'),
('sessions.manage','Управление сессиями сотрудников','admin'),
('system.manage','Управление системными настройками','admin')
on conflict do nothing;

insert into role_permissions (role, permission_key)
values
('super_admin','profile.read'),('super_admin','profile.manage'),('super_admin','settings.manage'),('super_admin','rooms.read'),('super_admin','rooms.create'),('super_admin','rooms.archive'),('super_admin','messages.write'),('super_admin','messages.edit_own'),('super_admin','messages.delete_own'),('super_admin','messages.moderate'),('super_admin','files.upload'),('super_admin','files.manage'),('super_admin','voice.join'),('super_admin','voice.share_screen'),('super_admin','voice.moderate'),('super_admin','meetings.manage'),('super_admin','admin.access'),('super_admin','users.manage'),('super_admin','roles.manage'),('super_admin','audit.read'),('super_admin','sessions.manage'),('super_admin','system.manage'),
('admin','profile.read'),('admin','profile.manage'),('admin','settings.manage'),('admin','rooms.read'),('admin','rooms.create'),('admin','rooms.archive'),('admin','messages.write'),('admin','messages.edit_own'),('admin','messages.delete_own'),('admin','messages.moderate'),('admin','files.upload'),('admin','files.manage'),('admin','voice.join'),('admin','voice.share_screen'),('admin','voice.moderate'),('admin','meetings.manage'),('admin','admin.access'),('admin','users.manage'),('admin','roles.manage'),('admin','audit.read'),('admin','sessions.manage'),('admin','system.manage'),
('leader','profile.read'),('leader','settings.manage'),('leader','rooms.read'),('leader','rooms.create'),('leader','messages.write'),('leader','messages.edit_own'),('leader','messages.delete_own'),('leader','files.upload'),('leader','voice.join'),('leader','voice.share_screen'),('leader','meetings.manage'),
('moderator','profile.read'),('moderator','settings.manage'),('moderator','rooms.read'),('moderator','messages.write'),('moderator','messages.edit_own'),('moderator','messages.delete_own'),('moderator','messages.moderate'),('moderator','files.upload'),('moderator','files.manage'),('moderator','voice.join'),('moderator','voice.share_screen'),('moderator','voice.moderate'),
('member','profile.read'),('member','settings.manage'),('member','rooms.read'),('member','messages.write'),('member','messages.edit_own'),('member','messages.delete_own'),('member','files.upload'),('member','voice.join'),
('guest','profile.read'),('guest','rooms.read'),('guest','messages.write'),('guest','voice.join'),
('external','profile.read'),('external','rooms.read'),('external','messages.write'),('external','voice.join')
on conflict do nothing;

insert into rooms (id, name, kind, is_private)
values
('10000000-0000-0000-0000-000000000001','Общий контур','group',false),
('10000000-0000-0000-0000-000000000002','Голосовой контур','voice',false),
('10000000-0000-0000-0000-000000000003','Комната для собраний','meeting',false),
('10000000-0000-0000-0000-000000000004','Руководители проектов','group',true)
on conflict do nothing;

insert into room_members (room_id, user_id)
values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004'),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003')
on conflict do nothing;

insert into messages (id, room_id, author_user_id, body)
values
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Стартовое сообщение боевого контура'),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Русская оболочка и дисциплина релиза вынесены в отдельный этап V17'),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','Повестка: утвердить baseline, русификацию shell и дальнейший порядок этапов')
on conflict do nothing;

insert into invitations (id, email, role, invited_by_user_id, token_hash, note, expires_at)
values
(
  '20000000-0000-0000-0000-000000000001',
  'new.employee@corpchat.local',
  'member',
  '00000000-0000-0000-0000-000000000001',
  encode(digest('invite_demo_stage2_2026', 'sha256'), 'hex'),
  'Демонстрационное приглашение для этапа 2',
  now() + interval '30 days'
)
on conflict do nothing;


insert into meetings (room_id, status, title, agenda, host_user_id)
values
('10000000-0000-0000-0000-000000000003','planned','Еженедельное рабочее собрание','1. Статус V17
2. Голосовые комнаты
3. Проверка сценариев понедельника','00000000-0000-0000-0000-000000000003')
on conflict do nothing;

insert into meeting_events (id, room_id, actor_user_id, event_type, body)
values
(gen_random_uuid(),'10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','note','Подготовить демонстрацию голосовой комнаты с ролями и профилями.'),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','decision','Базовый внешний вид shell сохраняем, дорабатываем только рабочую логику.')
on conflict do nothing;

insert into voice_participants (room_id, user_id, voice_role, is_connected, is_muted, is_deafened, hand_raised, is_speaking, screen_active, voice_banned)
values
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','host',true,false,false,false,false,false,false),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','member',true,false,false,true,false,false,false),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','moderator',false,true,false,false,false,false,false),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','host',true,false,false,false,false,false,false)
on conflict do nothing;

insert into system_settings (key, value_json)
values
(
  'branding',
  jsonb_build_object(
    'appName','Контур Связи',
    'organizationName','IT Group Company',
    'organizationInn','',
    'licensePlan','Корпоративный пакет · 100 пользователей',
    'supportLabel','Техническая поддержка',
    'supportEmail','support@kontur.local',
    'releaseLabel','V17',
    'footerMark','Единый корпоративный контур связи, собраний и администрирования'
  )
)
on conflict (key) do nothing;
