#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.preview.jsx"

if [ ! -f "$TARGET" ]; then
  echo "[ERR] target file not found: $TARGET"
  exit 1
fi

if grep -q "SignalumRoomBasedPreviewOpsPage" "$TARGET"; then
  echo "[OK] room-based preview ops page is enabled"
  exit 0
fi

echo "[WARN] room-based preview ops page is not enabled"
exit 2
