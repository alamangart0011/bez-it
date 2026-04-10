#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

query_bool() {
  local sql="$1"
  docker compose exec -T db sh -lc 'psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' <<SQL | tr -d '\r'
${sql}
SQL
}

check_table_exists() {
  local table="$1"
  local result=""
  result="$(query_bool "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}');")"
  if [ "$result" != "t" ]; then
    echo "[ERR] missing table: $table"
    exit 1
  fi
  echo "[OK] table exists: $table"
}

check_column_exists() {
  local table="$1"
  local column="$2"
  local result=""
  result="$(query_bool "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = '${column}');")"
  if [ "$result" != "t" ]; then
    echo "[ERR] missing column: ${table}.${column}"
    exit 1
  fi
  echo "[OK] column exists: ${table}.${column}"
}

echo "[PARITY] room-based baseline"
check_table_exists "users"
check_table_exists "rooms"
check_table_exists "room_members"
check_table_exists "messages"
check_table_exists "voice_participants"
check_table_exists "audit_logs"

check_column_exists "rooms" "kind"
check_column_exists "rooms" "access_mode"
check_column_exists "rooms" "is_archived"
check_column_exists "rooms" "is_private"
check_column_exists "messages" "room_id"
check_column_exists "messages" "content"
check_column_exists "messages" "is_deleted"
check_column_exists "voice_participants" "room_id"
check_column_exists "voice_participants" "user_id"
check_column_exists "voice_participants" "is_connected"

echo "[OK] runtime parity complete"
