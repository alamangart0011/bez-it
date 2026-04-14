#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

cd "$APP_DIR"

if [ -f scripts/cleanup_preview_legacy_files.sh ]; then
  bash scripts/cleanup_preview_legacy_files.sh
fi

rm -rf frontend/dist
cd frontend
if [ ! -d node_modules ]; then
  npm install
fi
npm run build
cd ..

if command -v docker >/dev/null 2>&1; then
  docker compose down web || true
  docker image rm contour-chat-jino-final-web:latest || true
  docker compose build --no-cache web
  docker compose up -d web
fi

echo "[OK] exact shell cleanup finalized"
echo "[INFO] open ${BASE_URL}/?preview=1"
