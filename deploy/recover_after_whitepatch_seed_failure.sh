#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

cat > infra/sql/015_backend_whitepatch_runtime_seed.sql <<'SQL'
update rooms
set entry_mode = case
  when kind in ('voice','meeting') then coalesce(nullif(entry_mode, ''), 'knock')
  else coalesce(nullif(entry_mode, ''), 'open')
end;

with seed_user as (
  select u.id
  from users u
  where coalesce(u.is_active, true) = true
  order by
    case when u.role in ('super_admin','admin') then 0 else 1 end,
    u.created_at nulls last,
    u.id
  limit 1
)
insert into meeting_presence_logs (id, room_id, user_id, actor_user_id, event_type, note)
select
  gen_random_uuid(),
  r.id,
  coalesce(r.created_by, su.id),
  null,
  'joined',
  'Whitepatch bootstrap presence log'
from rooms r
cross join seed_user su
left join meeting_presence_logs mpl on mpl.room_id = r.id
where r.kind = 'meeting'
  and mpl.id is null
  and coalesce(r.created_by, su.id) is not null;

insert into room_incidents (id, room_id, actor_user_id, target_user_id, incident_type, severity, status, note, meta_json)
select gen_random_uuid(), r.id, null, null, 'baseline_watch', 'warning', 'resolved', 'Whitepatch baseline watch marker', jsonb_build_object('source','whitepatch')
from rooms r
left join room_incidents ri on ri.room_id = r.id and ri.incident_type = 'baseline_watch'
where r.kind in ('voice','meeting')
  and ri.id is null;

insert into system_settings (key, value_json)
values (
  'runtime',
  jsonb_build_object(
    'singleDeployPath', true,
    'singleRuntimePath', true,
    'baseline', 'room-based-v17',
    'whitepatch', 'applied'
  )
)
on conflict (key) do update
set value_json = system_settings.value_json || excluded.value_json,
    updated_at = now();
SQL

./deploy/apply_sql.sh
./scripts/smoke_api.sh http://127.0.0.1:3001
./deploy/post_deploy_check.sh

echo "[OK] whitepatch seed recovery complete"
