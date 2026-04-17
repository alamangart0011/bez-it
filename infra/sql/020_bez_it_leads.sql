-- bez-it.ru: база лидов для ИП Сапрыкина Е.В.
-- Лиды собираются с лендинга и маршрутизируются в oboron-it.ru и cent-it.ru.

create table if not exists bez_it_leads (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  source       text        not null default 'bez-it.ru',
  channel      text        not null default 'form',
  segment      text,
  service_key  text,
  route_target text        not null default 'both',
  company_name text,
  contact_name text,
  phone        text,
  email        text,
  city         text,
  head_count   text,
  budget       text,
  deadline     text,
  comment      text,
  quiz_answers jsonb       not null default '{}'::jsonb,
  utm          jsonb       not null default '{}'::jsonb,
  user_agent   text,
  ip_addr      text,
  status       text        not null default 'new'
    check (status in ('new','in_progress','routed_oboron','routed_cent','routed_both','won','lost','duplicate','spam')),
  assigned_to  text,
  notes        text
);

create index if not exists bez_it_leads_created_idx on bez_it_leads (created_at desc);
create index if not exists bez_it_leads_status_idx  on bez_it_leads (status);
create index if not exists bez_it_leads_service_idx on bez_it_leads (service_key);
create index if not exists bez_it_leads_phone_idx   on bez_it_leads (phone);

create table if not exists bez_it_lead_routes (
  id          bigserial primary key,
  lead_id     bigint      not null references bez_it_leads(id) on delete cascade,
  target      text        not null check (target in ('oboron','cent','email','telegram','webhook')),
  channel     text        not null,
  status      text        not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  attempt     integer     not null default 0,
  last_error  text,
  delivered_at timestamptz,
  payload     jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists bez_it_lead_routes_lead_idx on bez_it_lead_routes (lead_id);
create index if not exists bez_it_lead_routes_status_idx on bez_it_lead_routes (status);

create table if not exists bez_it_cabinet_tokens (
  id         bigserial primary key,
  token_hash text        not null unique,
  label      text        not null default 'ip-saprykina',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists bez_it_cabinet_tokens_label_idx on bez_it_cabinet_tokens (label);

create table if not exists bez_it_landing_stats (
  id         bigserial primary key,
  event_type text        not null,
  page       text,
  session_id text,
  payload    jsonb       not null default '{}'::jsonb,
  user_agent text,
  ip_addr    text,
  created_at timestamptz not null default now()
);

create index if not exists bez_it_landing_stats_created_idx on bez_it_landing_stats (created_at desc);
create index if not exists bez_it_landing_stats_type_idx    on bez_it_landing_stats (event_type);
