alter table rooms
  add column if not exists entry_mode text not null default 'open';

alter table rooms
  drop constraint if exists rooms_entry_mode_check;

alter table rooms
  add constraint rooms_entry_mode_check check (entry_mode in ('open','knock'));

create table if not exists room_join_requests (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','denied','cancelled')),
  note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid null references users(id) on delete set null
);

create unique index if not exists idx_room_join_requests_pending
  on room_join_requests(room_id, user_id)
  where status = 'pending';

create index if not exists idx_room_join_requests_room_status
  on room_join_requests(room_id, status, requested_at desc);

insert into system_settings (key, value_json)
values (
  'branding',
  jsonb_build_object(
    'releaseLabel','17.13.0 entry-gate',
    'footerMark','Единый корпоративный контур связи, собраний, контролируемого входа в голос и административного центра.'
  )
)
on conflict (key) do update set value_json = system_settings.value_json || excluded.value_json, updated_at = now();
