create table if not exists meeting_presence_logs (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  actor_user_id uuid null references users(id) on delete set null,
  event_type text not null check (event_type in ('requested','approved','denied','joined','left','removed','moved_in','moved_out')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_presence_logs_room_created
  on meeting_presence_logs(room_id, created_at desc);

create index if not exists idx_meeting_presence_logs_user_created
  on meeting_presence_logs(user_id, created_at desc);

insert into system_settings (key, value_json)
values (
  'branding',
  jsonb_build_object(
    'releaseLabel','17.14.0 launch-board',
    'footerMark','Единый корпоративный контур связи, собраний, управляемого входа, журналов присутствия и административного launch-board.'
  )
)
on conflict (key) do update set value_json = system_settings.value_json || excluded.value_json, updated_at = now();
