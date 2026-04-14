#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
TARGET="$APP_DIR/frontend/src/App.jsx"
BACKUP="$APP_DIR/frontend/src/App.jsx.before_preview_bridge"

if [ ! -f "$TARGET" ]; then
  echo "[ERR] target file not found: $TARGET"
  exit 1
fi

cp "$TARGET" "$BACKUP"
cat > "$TARGET" <<'EOF'
import AppRoom from './App.room.jsx';
import AppPreview from './App.preview.jsx';
import { shouldUseRoomBasedPreview } from './preview/previewFlags.js';

export default function App() {
  return shouldUseRoomBasedPreview() ? <AppPreview /> : <AppRoom />;
}
EOF

echo "[OK] room-based preview bridge enabled"
echo "[INFO] backup saved: $BACKUP"
