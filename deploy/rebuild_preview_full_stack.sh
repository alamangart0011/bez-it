#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

cd "$APP_DIR"

bash deploy/apply_preview_full_stack.sh

if command -v docker >/dev/null 2>&1; then
  docker compose build web
  docker compose up -d web
fi

bash scripts/check_preview_full_stack.sh

echo "[OK] preview full stack rebuilt"
echo "[INFO] open ${BASE_URL}/?preview=1"
