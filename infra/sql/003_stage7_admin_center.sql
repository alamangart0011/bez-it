alter table rooms add column if not exists is_archived boolean not null default false;

create table if not exists system_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

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
