#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.preview.jsx"
BACKUP="$APP_DIR/frontend/src/App.preview.jsx.before_ops_page"

if [ ! -f "$BACKUP" ]; then
  echo "[ERR] backup file not found: $BACKUP"
  exit 1
fi

cp "$BACKUP" "$TARGET"

echo "[OK] room-based preview ops page restored from backup"
echo "[INFO] restored target: $TARGET"
