#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.preview.jsx"
BACKUP="$APP_DIR/frontend/src/App.preview.jsx.before_ops_page_v2"

if [ ! -f "$TARGET" ]; then
  echo "[ERR] target file not found: $TARGET"
  exit 1
fi

cp "$TARGET" "$BACKUP"
cat > "$TARGET" <<'EOF'
import React from 'react';
import SignalumRoomBasedPreviewOpsPageV2 from './preview/SignalumRoomBasedPreviewOpsPageV2.jsx';

export default function AppPreview() {
  return <SignalumRoomBasedPreviewOpsPageV2 />;
}
EOF

echo "[OK] room-based preview ops page v2 enabled"
echo "[INFO] backup saved: $BACKUP"
