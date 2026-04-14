#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERR] docker is required"
  exit 1
fi

if ! docker compose ps >/dev/null 2>&1; then
  echo "[ERR] docker compose context is not ready"
  exit 1
fi

docker compose exec -T db sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
WITH checks AS (
  SELECT 'users' AS object_name, EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) AS ok
  UNION ALL
  SELECT 'rooms', EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  )
  UNION ALL
  SELECT 'voice_participants', EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'voice_participants'
  )
  UNION ALL
  SELECT 'meetings', EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'meetings'
  )
  UNION ALL
  SELECT 'system_settings', EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'system_settings'
  )
  UNION ALL
  SELECT 'invitations', EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invitations'
  )
  UNION ALL
  SELECT 'room_members_or_memberships', (
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_members')
    OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_memberships')
  )
  UNION ALL
  SELECT 'users.email', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
  )
  UNION ALL
  SELECT 'users.password_hash', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
  )
  UNION ALL
  SELECT 'users.role', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  )
  UNION ALL
  SELECT 'rooms.name', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'name'
  )
  UNION ALL
  SELECT 'rooms.kind', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'kind'
  )
  UNION ALL
  SELECT 'voice_participants.room_id', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voice_participants' AND column_name = 'room_id'
  )
  UNION ALL
  SELECT 'voice_participants.user_id', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voice_participants' AND column_name = 'user_id'
  )
  UNION ALL
  SELECT 'meetings.room_id', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetings' AND column_name = 'room_id'
  )
)
SELECT object_name, ok FROM checks ORDER BY object_name;
SQL

echo "[OK] portal schema guard passed"
