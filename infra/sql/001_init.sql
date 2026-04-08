create extension if not exists pgcrypto;

create table if not exists departments (
  id uuid primary key,
  name text not null unique,
  code text unique,
  leader_user_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key,
  display_name text not null,
  username text not null unique,
  email text not null unique,
  role text not null check (role in ('super_admin','admin','leader','moderator','member','guest','external','blocked')),
  status text not null check (status in ('online','away','busy','offline')),
  is_active boolean not null default true,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table departments
  add constraint departments_leader_user_fk
  foreign key (leader_user_id) references users(id) on delete set null;

create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  department_id uuid null references departments(id) on delete set null,
  photo_url text,
  job_title text,
  phone text,
  about text,
  updated_at timestamptz not null default now()
);

create table if not exists user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark','light','system')),
  notifications_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  desktop_notifications boolean not null default true,
  compact_mode boolean not null default false,
  enter_to_send boolean not null default true,
  push_to_talk boolean not null default false,
  voice_input_device text,
  voice_output_device text,
  font_scale text not null default 'normal' check (font_scale in ('small','normal','large')),
  high_contrast boolean not null default false,
  reduce_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists permissions (
  key text primary key,
  title text not null,
  module text not null
);

create table if not exists role_permissions (
  role text not null,
  permission_key text not null references permissions(key) on delete cascade,
  primary key (role, permission_key)
);

create table if not exists rooms (
  id uuid primary key,
  name text not null,
  kind text not null check (kind in ('dm','group','channel','voice','stage','meeting')),
  is_private boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);
alter table rooms add column if not exists is_archived boolean not null default false;

create table if not exists room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists messages (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  author_user_id uuid not null references users(id),
  body text not null,
  reply_to_message_id uuid null references messages(id) on delete set null,
  is_edited boolean not null default false,
  is_deleted boolean not null default false,
  is_pinned boolean not null default false,
  edited_at timestamptz null,
  deleted_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists attachments (
  id uuid primary key,
  message_id uuid references messages(id) on delete cascade,
  file_name text not null,
  original_name text not null,
  file_path text not null,
  public_url text not null,
  content_type text,
  file_kind text not null default 'file',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);



create table if not exists meetings (
  room_id uuid primary key references rooms(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned','active','closed')),
  title text,
  agenda text,
  summary text,
  host_user_id uuid null references users(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists meeting_events (
  id uuid primary key,
  room_id uuid not null references meetings(room_id) on delete cascade,
  actor_user_id uuid null references users(id) on delete set null,
  event_type text not null check (event_type in ('note','decision','action','start','finish')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists voice_participants (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  voice_role text not null default 'member' check (voice_role in ('member','moderator','host')),
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

create table if not exists audit_logs (
  id uuid primary key,
  actor_user_id uuid,
  action text not null,
  target text,
  result text not null default 'success',
  meta_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists auth_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null unique,
  user_agent text,
  ip_address text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);


create table if not exists system_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists invitations (
  id uuid primary key,
  email text not null,
  role text not null check (role in ('super_admin','admin','leader','moderator','member','guest','external','blocked')),
  invited_by_user_id uuid null references users(id) on delete set null,
  accepted_user_id uuid null references users(id) on delete set null,
  token_hash text not null unique,
  note text,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_department on user_profiles(department_id);
create index if not exists idx_messages_room_created on messages(room_id, created_at);
create index if not exists idx_messages_pinned on messages(room_id, is_pinned, created_at desc);
create index if not exists idx_attachments_message on attachments(message_id, created_at);
create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_auth_sessions_user on auth_sessions(user_id, expires_at desc);
create index if not exists idx_password_reset_user on password_reset_tokens(user_id, expires_at desc);
create index if not exists idx_invitations_email on invitations(lower(email), expires_at desc);
create index if not exists idx_role_permissions_role on role_permissions(role);

create index if not exists idx_meeting_events_room on meeting_events(room_id, created_at desc);
create index if not exists idx_voice_participants_room on voice_participants(room_id, updated_at desc);
