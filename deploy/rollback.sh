#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BACKUP_FILE="${1:-}"
RESTORE_DIR="$(mktemp -d /tmp/corpchat-rollback-XXXXXX)"
cleanup() { rm -rf "$RESTORE_DIR"; }
trap cleanup EXIT

if [ -z "$BACKUP_FILE" ]; then
  echo "[ERR] usage: deploy/rollback.sh /path/to/backup.tar.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[ERR] backup file not found: $BACKUP_FILE"
  exit 1
fi

mkdir -p "$APP_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

shopt -s dotglob nullglob
rm -rf "$APP_DIR"/*
cp -a "$RESTORE_DIR"/. "$APP_DIR"/

cd "$APP_DIR"
docker compose up -d --build || true

echo "[OK] rollback restored from $BACKUP_FILE"
