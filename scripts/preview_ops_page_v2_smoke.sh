#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.preview.jsx"
OPS_PAGE="$APP_DIR/frontend/src/preview/SignalumRoomBasedPreviewOpsPageV2.jsx"
SHELL_V2="$APP_DIR/frontend/src/preview/SignalumRoomBasedPreviewV2.jsx"

for file in "$TARGET" "$OPS_PAGE" "$SHELL_V2"; do
  if [ ! -f "$file" ]; then
    echo "[ERR] required file not found: $file"
    exit 1
  fi
done

if ! grep -q "SignalumRoomBasedPreviewOpsPageV2" "$TARGET"; then
  echo "[ERR] App.preview.jsx does not point to SignalumRoomBasedPreviewOpsPageV2"
  exit 1
fi

echo "[OK] preview ops page v2 smoke passed"
