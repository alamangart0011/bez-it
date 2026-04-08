create table if not exists room_incidents (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  actor_user_id uuid null references users(id) on delete set null,
  target_user_id uuid null references users(id) on delete set null,
  incident_type text not null check (incident_type in ('entry_denied','voice_removed','voice_banned','voice_moved','disconnect_all')),
  severity text not null default 'warning' check (severity in ('low','warning','critical')),
  status text not null default 'open' check (status in ('open','acknowledged')),
  note text,
  meta_json jsonb,
  acknowledged_at timestamptz,
  acknowledged_by_user_id uuid null references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_incidents_room_created on room_incidents(room_id, created_at desc);
create index if not exists idx_room_incidents_status_created on room_incidents(status, created_at desc);
create index if not exists idx_room_incidents_target_created on room_incidents(target_user_id, created_at desc);

insert into system_settings (key, value_json)
values (
  'branding',
  jsonb_build_object(
    'releaseLabel', '17.16.0 launch-monitor',
    'footerMark', 'Единый корпоративный контур связи, собраний, контролируемого входа, launch-board и инцидентного мониторинга комнат.'
  )
)
on conflict (key) do update
set value_json = system_settings.value_json || excluded.value_json,
    updated_at = now();
