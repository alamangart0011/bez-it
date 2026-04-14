#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

cd "$APP_DIR"

bash bin/enable_room_based_preview_ops_page_v2.sh
bash scripts/preview_ops_page_v2_smoke.sh

cd frontend
if [ ! -d node_modules ]; then
  npm install
fi
npm run build
cd ..

if command -v docker >/dev/null 2>&1; then
  docker compose build web
  docker compose up -d web
fi

echo "[OK] preview ops page v2 applied"
echo "[INFO] open ${BASE_URL}/?preview=1"
