#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.preview.jsx"
PAGE="$APP_DIR/frontend/src/preview/SignalumRoomBasedPreviewHtmlReferencePage.jsx"
SHELL="$APP_DIR/frontend/src/preview/SignalumRoomBasedPreviewHtmlReference.jsx"

for file in "$TARGET" "$PAGE" "$SHELL"; do
  if [ ! -f "$file" ]; then
    echo "[ERR] required file not found: $file"
    exit 1
  fi
done

if ! grep -q "SignalumRoomBasedPreviewHtmlReferencePage" "$TARGET"; then
  echo "[ERR] App.preview.jsx does not point to SignalumRoomBasedPreviewHtmlReferencePage"
  exit 1
fi

echo "[OK] preview HTML reference shell smoke passed"
