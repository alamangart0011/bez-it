create extension if not exists pgcrypto;

-- user profiles for all current users
insert into user_profiles (user_id, department_id, updated_at)
select
  u.id,
  (select d.id from departments d where lower(d.name) = lower('Общий отдел') limit 1),
  now()
from users u
where not exists (
  select 1 from user_profiles up where up.user_id = u.id
)
on conflict (user_id) do nothing;

-- canonical public rooms should contain active users
insert into room_members (room_id, user_id, joined_at)
select
  r.id,
  u.id,
  now()
from rooms r
join users u on u.is_active = true
where r.is_archived = false
  and r.is_private = false
  and r.name in ('Общий контур', 'Голосовой контур', 'Комната для собраний')
  and not exists (
    select 1 from room_members rm where rm.room_id = r.id and rm.user_id = u.id
  )
on conflict (room_id, user_id) do nothing;

-- every meeting room should have a meetings row
insert into meetings (room_id, status, title, host_user_id, updated_at)
select
  r.id,
  'planned',
  coalesce(nullif(r.name, ''), 'Комната для собраний'),
  null,
  now()
from rooms r
where r.kind = 'meeting'
  and not exists (
    select 1 from meetings m where m.room_id = r.id
  )
on conflict (room_id) do nothing;

-- every member of voice/meeting canonical rooms should have a passive voice state row
insert into voice_participants (
  room_id,
  user_id,
  voice_role,
  is_connected,
  is_muted,
  is_deafened,
  hand_raised,
  is_speaking,
  screen_active,
  voice_banned,
  connected_at,
  updated_at
)
select
  rm.room_id,
  rm.user_id,
  case
    when lower(u.role) in ('super_admin', 'admin') then 'host'
    when lower(u.role) in ('leader', 'moderator') then 'moderator'
    else 'member'
  end,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  null,
  now()
from room_members rm
join rooms r on r.id = rm.room_id
join users u on u.id = rm.user_id
where r.kind in ('voice', 'meeting')
  and r.is_archived = false
  and not exists (
    select 1 from voice_participants vp where vp.room_id = rm.room_id and vp.user_id = rm.user_id
  )
on conflict (room_id, user_id) do nothing;

-- announcement key should always exist alongside branding
insert into system_settings (key, value_json)
values (
  'announcement',
  '{"isActive":false,"level":"info","title":"","message":"","activeUntil":null,"scope":"all"}'::jsonb
)
on conflict (key) do nothing;

-- normalize room entry mode for active baseline
update rooms
set entry_mode = 'open'
where entry_mode is null
   or entry_mode not in ('open', 'knock', 'closed');
