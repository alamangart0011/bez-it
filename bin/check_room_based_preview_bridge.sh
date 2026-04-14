#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.jsx"

if [ ! -f "$TARGET" ]; then
  echo "[ERR] target file not found: $TARGET"
  exit 1
fi

if grep -q "App.preview.jsx" "$TARGET" && grep -q "shouldUseRoomBasedPreview" "$TARGET"; then
  echo "[OK] room-based preview bridge is enabled"
  exit 0
fi

echo "[WARN] room-based preview bridge is not enabled"
exit 2
