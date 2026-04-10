#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

docker compose exec -T db sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -P pager=off -f -' <<'SQL'
\echo '=== runtime contract guard ==='

create temporary table if not exists _required_tables(name text primary key);
truncate _required_tables;
insert into _required_tables(name) values
  ('users'),
  ('rooms'),
  ('room_members'),
  ('user_profiles'),
  ('departments'),
  ('auth_sessions'),
  ('password_reset_tokens'),
  ('invitations'),
  ('system_settings'),
  ('audit_logs'),
  ('voice_participants'),
  ('room_join_requests'),
  ('meetings'),
  ('meeting_events'),
  ('meeting_presence_logs'),
  ('room_incidents');

create temporary table if not exists _missing_tables as
select rt.name
from _required_tables rt
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = rt.name
where t.table_name is null;

create temporary table if not exists _required_columns(table_name text, column_name text, primary key(table_name, column_name));
truncate _required_columns;
insert into _required_columns(table_name, column_name) values
  ('users','display_name'),
  ('users','username'),
  ('users','status'),
  ('users','is_active'),
  ('users','password_hash'),
  ('rooms','is_private'),
  ('rooms','is_archived'),
  ('rooms','entry_mode'),
  ('room_members','room_id'),
  ('room_members','user_id'),
  ('user_profiles','user_id'),
  ('departments','name'),
  ('auth_sessions','user_id'),
  ('auth_sessions','refresh_token_hash'),
  ('password_reset_tokens','user_id'),
  ('invitations','email'),
  ('system_settings','key'),
  ('system_settings','value_json'),
  ('audit_logs','action'),
  ('voice_participants','room_id'),
  ('voice_participants','user_id'),
  ('voice_participants','voice_role'),
  ('meetings','room_id'),
  ('meetings','status'),
  ('meeting_events','room_id'),
  ('meeting_presence_logs','room_id'),
  ('room_incidents','room_id'),
  ('room_incidents','incident_type');

create temporary table if not exists _missing_columns as
select rc.table_name, rc.column_name
from _required_columns rc
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = rc.table_name
 and c.column_name = rc.column_name
where c.column_name is null;

\echo '--- missing tables ---'
select * from _missing_tables order by name;
\echo '--- missing columns ---'
select * from _missing_columns order by table_name, column_name;

DO $$
DECLARE
  mt integer;
  mc integer;
BEGIN
  select count(*) into mt from _missing_tables;
  select count(*) into mc from _missing_columns;
  if mt > 0 or mc > 0 then
    raise exception 'runtime contract guard failed: missing_tables=%, missing_columns=%', mt, mc;
  end if;
END $$;
SQL

echo "[OK] sql runtime contract guard passed"
