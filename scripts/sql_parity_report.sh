#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"

cd "$APP_DIR"

echo "[INFO] sql parity report for active baseline"
echo "[INFO] app dir: $APP_DIR"

docker compose exec -T db sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -P pager=off -f -' <<'SQL'
\echo '=== DB META ==='
select current_database() as db, current_user as db_user, now() as ts;

\echo '=== KEY TABLES ==='
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users',
    'rooms',
    'room_members',
    'voice_participants',
    'meetings',
    'meeting_events',
    'meeting_presence_logs',
    'user_profiles',
    'departments',
    'invitations',
    'system_settings',
    'room_incidents',
    'auth_sessions',
    'password_reset_tokens',
    'audit_logs'
  )
order by table_name;

\echo '=== COUNTS ==='
select 'users' as table_name, count(*)::bigint as rows_count from users
union all
select 'rooms', count(*)::bigint from rooms
union all
select 'room_members', count(*)::bigint from room_members
union all
select 'voice_participants', count(*)::bigint from voice_participants
union all
select 'meetings', count(*)::bigint from meetings
union all
select 'user_profiles', count(*)::bigint from user_profiles
union all
select 'departments', count(*)::bigint from departments
union all
select 'invitations', count(*)::bigint from invitations
union all
select 'system_settings', count(*)::bigint from system_settings
union all
select 'room_incidents', count(*)::bigint from room_incidents
union all
select 'auth_sessions', count(*)::bigint from auth_sessions
order by table_name;

\echo '=== USERS COLUMNS ==='
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'users'
  and column_name in ('display_name', 'username', 'status', 'is_active', 'password_hash', 'created_at')
order by column_name;

\echo '=== ROOMS COLUMNS ==='
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'rooms'
  and column_name in ('is_private', 'is_archived', 'entry_mode', 'created_at', 'kind', 'name')
order by column_name;

\echo '=== SYSTEM SETTINGS KEYS ==='
select key
from system_settings
order by key;

\echo '=== CANONICAL ROOMS ==='
select id, name, kind, is_private, is_archived, entry_mode
from rooms
where name in ('Общий контур', 'Голосовой контур', 'Комната для собраний')
order by name;
SQL

echo "[OK] sql parity report completed"
