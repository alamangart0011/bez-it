create extension if not exists pgcrypto;

create table if not exists voice_participants (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  voice_role text not null default 'member',
  is_connected boolean not null default false,
  is_muted boolean not null default false,
  is_deafened boolean not null default false,
  hand_raised boolean not null default false,
  is_speaking boolean not null default false,
  screen_active boolean not null default false,
  voice_banned boolean not null default false,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table voice_participants add column if not exists voice_role text not null default 'member';
alter table voice_participants add column if not exists is_connected boolean not null default false;
alter table voice_participants add column if not exists is_muted boolean not null default false;
alter table voice_participants add column if not exists is_deafened boolean not null default false;
alter table voice_participants add column if not exists hand_raised boolean not null default false;
alter table voice_participants add column if not exists is_speaking boolean not null default false;
alter table voice_participants add column if not exists screen_active boolean not null default false;
alter table voice_participants add column if not exists voice_banned boolean not null default false;
alter table voice_participants add column if not exists connected_at timestamptz;
alter table voice_participants add column if not exists updated_at timestamptz not null default now();

create table if not exists room_join_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending',
  note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references users(id) on delete set null
);

create index if not exists idx_room_join_requests_room_id on room_join_requests(room_id);
create index if not exists idx_room_join_requests_status on room_join_requests(status);

create table if not exists meetings (
  room_id uuid primary key references rooms(id) on delete cascade,
  status text not null default 'planned',
  title text,
  agenda text,
  summary text,
  host_user_id uuid references users(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table meetings add column if not exists status text not null default 'planned';
alter table meetings add column if not exists title text;
alter table meetings add column if not exists agenda text;
alter table meetings add column if not exists summary text;
alter table meetings add column if not exists host_user_id uuid references users(id) on delete set null;
alter table meetings add column if not exists started_at timestamptz;
alter table meetings add column if not exists ended_at timestamptz;
alter table meetings add column if not exists updated_at timestamptz not null default now();

create table if not exists meeting_events (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  event_type text not null,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_events_room_id on meeting_events(room_id);

create table if not exists meeting_presence_logs (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  actor_user_id uuid references users(id) on delete set null,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_presence_logs_room_id on meeting_presence_logs(room_id);

create table if not exists room_incidents (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  target_user_id uuid references users(id) on delete set null,
  incident_type text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  note text,
  meta_json jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by_user_id uuid references users(id) on delete set null
);

alter table room_incidents add column if not exists actor_user_id uuid references users(id) on delete set null;
alter table room_incidents add column if not exists target_user_id uuid references users(id) on delete set null;
alter table room_incidents add column if not exists note text;
alter table room_incidents add column if not exists meta_json jsonb;
alter table room_incidents add column if not exists acknowledged_at timestamptz;
alter table room_incidents add column if not exists acknowledged_by_user_id uuid references users(id) on delete set null;

create index if not exists idx_room_incidents_room_id on room_incidents(room_id);
create index if not exists idx_room_incidents_status on room_incidents(status);
