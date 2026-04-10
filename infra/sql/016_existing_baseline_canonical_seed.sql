-- Safe seed for existing baseline after runtime parity

insert into rooms (id, name, kind, is_private, is_archived, entry_mode)
values
  ('10000000-0000-0000-0000-000000000001','Общий контур','group',false,false,'open'),
  ('10000000-0000-0000-0000-000000000002','Голосовой контур','voice',false,false,'open'),
  ('10000000-0000-0000-0000-000000000003','Комната для собраний','meeting',false,false,'open')
on conflict (id) do update set
  name = excluded.name,
  kind = excluded.kind,
  is_private = excluded.is_private,
  is_archived = false,
  entry_mode = excluded.entry_mode;

insert into room_members (room_id, user_id)
select r.id, u.id
from rooms r
cross join users u
where r.id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
)
and u.is_active = true
on conflict (room_id, user_id) do nothing;

insert into meetings (room_id, status, title)
values
  ('10000000-0000-0000-0000-000000000003','planned','Комната для собраний')
on conflict (room_id) do update set
  status = coalesce(meetings.status, excluded.status),
  title = coalesce(meetings.title, excluded.title),
  updated_at = now();

insert into system_settings (key, value_json)
values
  ('branding', '{"appName":"Контур Связи","organizationName":"IT Group Company","organizationInn":"","licensePlan":"Корпоративный пакет · 100 пользователей","supportLabel":"Техническая поддержка","supportEmail":"support@kontur.local","releaseLabel":"V17","footerMark":"Единый корпоративный контур связи, собраний и администрирования"}'::jsonb),
  ('announcement', '{"isActive":false,"level":"info","title":"","message":"","activeUntil":null,"scope":"all"}'::jsonb)
on conflict (key) do nothing;

insert into voice_participants (room_id, user_id, voice_role, is_connected, is_muted, is_deafened, hand_raised, is_speaking, screen_active, voice_banned, updated_at)
select
  '10000000-0000-0000-0000-000000000002',
  u.id,
  case when lower(u.role) in ('super_admin','admin') then 'host'
       when lower(u.role) in ('leader','moderator') then 'moderator'
       else 'member' end,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  now()
from users u
where u.is_active = true
on conflict (room_id, user_id) do nothing;
