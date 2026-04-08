#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "[ERR] backup file not found"
  exit 1
fi

cd "$APP_DIR"
DB_CONTAINER="$(docker compose ps -q db)"
if [ -z "$DB_CONTAINER" ]; then
  echo "[ERR] db container not found"
  exit 1
fi

gzip -dc "$BACKUP_FILE" | docker exec -i -e PGPASSWORD="${POSTGRES_PASSWORD}" "$DB_CONTAINER"   psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "[OK] db restore completed from: $BACKUP_FILE"
