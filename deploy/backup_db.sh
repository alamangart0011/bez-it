#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/messenger/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_ROOT"
cd "$APP_DIR"

DB_CONTAINER="$(docker compose ps -q db)"
if [ -z "$DB_CONTAINER" ]; then
  echo "[ERR] db container not found"
  exit 1
fi

OUT_FILE="$BACKUP_ROOT/corpchat_db_${TIMESTAMP}.sql.gz"

docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" "$DB_CONTAINER"   pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists | gzip -9 > "$OUT_FILE"

echo "[OK] db backup saved: $OUT_FILE"
