#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.preview.jsx"
BACKUP="$APP_DIR/frontend/src/App.preview.jsx.before_html_reference_shell"

if [ ! -f "$TARGET" ]; then
  echo "[ERR] target file not found: $TARGET"
  exit 1
fi

cp "$TARGET" "$BACKUP"
cat > "$TARGET" <<'EOF'
import React from 'react';
import SignalumRoomBasedPreviewHtmlReferencePage from './preview/SignalumRoomBasedPreviewHtmlReferencePage.jsx';

export default function AppPreview() {
  return <SignalumRoomBasedPreviewHtmlReferencePage />;
}
EOF

echo "[OK] preview HTML reference shell enabled"
echo "[INFO] backup saved: $BACKUP"
