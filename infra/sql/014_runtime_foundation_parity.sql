create extension if not exists pgcrypto;

alter table users add column if not exists display_name text;
alter table users add column if not exists username text;
alter table users add column if not exists status text not null default 'offline';
alter table users add column if not exists is_active boolean not null default true;
alter table users add column if not exists password_hash text;
alter table users add column if not exists created_at timestamptz not null default now();

update users
set display_name = coalesce(nullif(display_name, ''), nullif(split_part(email, '@', 1), ''), 'Пользователь')
where display_name is null or display_name = '';

update users
set username = coalesce(nullif(username, ''), regexp_replace(coalesce(nullif(split_part(email, '@', 1), ''), 'user_' || left(id::text, 8)), '[^a-zA-Z0-9_]+', '_', 'g'))
where username is null or username = '';

create unique index if not exists idx_users_username_unique on users (lower(username));
create unique index if not exists idx_users_email_unique on users (lower(email));

alter table rooms add column if not exists is_private boolean not null default false;
alter table rooms add column if not exists is_archived boolean not null default false;
alter table rooms add column if not exists entry_mode text not null default 'open';
alter table rooms add column if not exists created_at timestamptz not null default now();

update rooms set entry_mode = 'open' where entry_mode is null or entry_mode = '';

create table if not exists room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  leader_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_departments_name_unique on departments (lower(name));

insert into departments (name)
select 'Общий отдел'
where not exists (select 1 from departments where lower(name) = lower('Общий отдел'));

create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  photo_url text,
  job_title text,
  phone text,
  about text,
  department_id uuid references departments(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into user_profiles (user_id, department_id)
select u.id, (select id from departments where lower(name) = lower('Общий отдел') limit 1)
from users u
where not exists (select 1 from user_profiles up where up.user_id = u.id)
on conflict (user_id) do nothing;

create table if not exists auth_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists idx_auth_sessions_user_id on auth_sessions(user_id);
create index if not exists idx_auth_sessions_expires_at on auth_sessions(expires_at);
create index if not exists idx_auth_sessions_token_hash on auth_sessions(refresh_token_hash);

create table if not exists password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_token_hash on password_reset_tokens(token_hash);

create table if not exists invitations (
  id uuid primary key,
  email text not null,
  role text not null default 'member',
  invited_by_user_id uuid references users(id) on delete set null,
  accepted_user_id uuid references users(id) on delete set null,
  token_hash text not null,
  note text,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_invitations_email on invitations(lower(email));
create index if not exists idx_invitations_token_hash on invitations(token_hash);

create table if not exists system_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into system_settings (key, value_json)
values
  ('branding', '{"appName":"Контур Связи","organizationName":"IT Group Company","organizationInn":"","licensePlan":"Корпоративный пакет · 100 пользователей","supportLabel":"Техническая поддержка","supportEmail":"support@kontur.local","releaseLabel":"V17","footerMark":"Единый корпоративный контур связи, собраний и администрирования"}'::jsonb),
  ('announcement', '{"isActive":false,"level":"info","title":"","message":"","activeUntil":null,"scope":"all"}'::jsonb)
on conflict (key) do nothing;

create table if not exists audit_logs (
  id uuid primary key,
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  target text,
  result text not null default 'success',
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
