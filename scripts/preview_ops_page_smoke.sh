#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.preview.jsx"
OPS_PAGE="$APP_DIR/frontend/src/preview/SignalumRoomBasedPreviewOpsPage.jsx"
RUNTIME_HOOK="$APP_DIR/frontend/src/preview/useRoomBasedPreviewRuntime.js"
ADMIN_HOOK="$APP_DIR/frontend/src/preview/usePreviewAdminWidgets.js"
ACTION_HOOK="$APP_DIR/frontend/src/preview/usePreviewActionHandlers.js"

for file in "$TARGET" "$OPS_PAGE" "$RUNTIME_HOOK" "$ADMIN_HOOK" "$ACTION_HOOK"; do
  if [ ! -f "$file" ]; then
    echo "[ERR] required file not found: $file"
    exit 1
  fi
done

if ! grep -q "SignalumRoomBasedPreviewOpsPage" "$TARGET"; then
  echo "[ERR] App.preview.jsx does not point to SignalumRoomBasedPreviewOpsPage"
  exit 1
fi

echo "[OK] preview ops page smoke passed"
