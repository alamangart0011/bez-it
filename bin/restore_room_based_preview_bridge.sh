#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.jsx"
BACKUP="$APP_DIR/frontend/src/App.jsx.before_preview_bridge"

if [ ! -f "$BACKUP" ]; then
  echo "[ERR] backup file not found: $BACKUP"
  exit 1
fi

cp "$BACKUP" "$TARGET"

echo "[OK] room-based preview bridge restored from backup"
echo "[INFO] restored target: $TARGET"
