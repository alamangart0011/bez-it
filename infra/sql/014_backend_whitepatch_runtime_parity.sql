create extension if not exists pgcrypto;

alter table rooms add column if not exists entry_mode text not null default 'open';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rooms_entry_mode_check'
  ) then
    alter table rooms
      add constraint rooms_entry_mode_check
      check (entry_mode in ('open', 'knock', 'closed'));
  end if;
exception when duplicate_object then
  null;
end $$;

create table if not exists room_join_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending',
  note text,
  reviewed_by_user_id uuid null references users(id) on delete set null,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_room_join_requests_room_status on room_join_requests(room_id, status, requested_at desc);
create index if not exists idx_room_join_requests_user_status on room_join_requests(user_id, status, requested_at desc);

create table if not exists meeting_presence_logs (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid null references users(id) on delete set null,
  actor_user_id uuid null references users(id) on delete set null,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_presence_logs_room_created on meeting_presence_logs(room_id, created_at desc);
create index if not exists idx_meeting_presence_logs_user_created on meeting_presence_logs(user_id, created_at desc);

create table if not exists room_incidents (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  actor_user_id uuid null references users(id) on delete set null,
  target_user_id uuid null references users(id) on delete set null,
  incident_type text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  note text,
  meta_json jsonb not null default '{}'::jsonb,
  acknowledged_at timestamptz,
  acknowledged_by_user_id uuid null references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_incidents_room_status on room_incidents(room_id, status, created_at desc);
create index if not exists idx_room_incidents_status_severity on room_incidents(status, severity, created_at desc);

create table if not exists room_incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references room_incidents(id) on delete cascade,
  actor_user_id uuid null references users(id) on delete set null,
  event_type text not null,
  note text,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_incident_events_incident_created on room_incident_events(incident_id, created_at desc);

alter table audit_logs alter column meta_json set default '{}'::jsonb;
update audit_logs set meta_json = '{}'::jsonb where meta_json is null;

insert into user_profiles (user_id)
select u.id
from users u
left join user_profiles up on up.user_id = u.id
where up.user_id is null;

insert into user_settings (
  user_id,
  theme,
  notifications_enabled,
  sound_enabled,
  desktop_notifications,
  compact_mode,
  enter_to_send,
  push_to_talk,
  font_scale,
  high_contrast,
  reduce_motion
)
select
  u.id,
  'dark',
  true,
  true,
  true,
  false,
  true,
  false,
  'normal',
  false,
  false
from users u
left join user_settings us on us.user_id = u.id
where us.user_id is null;

insert into system_settings (key, value_json)
values
(
  'announcement',
  jsonb_build_object(
    'isActive', false,
    'level', 'info',
    'title', '',
    'message', '',
    'activeUntil', null,
    'scope', 'all'
  )
)
on conflict (key) do nothing;

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
    'releaseLabel','17.18.0 whitepatch',
    'footerMark','Единый корпоративный контур связи, собраний, файлов, recovery и автоматизации'
  )
)
on conflict (key) do update
set value_json = system_settings.value_json || excluded.value_json,
    updated_at = now();

insert into meetings (room_id, host_user_id)
select r.id, null
from rooms r
left join meetings m on m.room_id = r.id
where r.kind = 'meeting' and m.room_id is null;
