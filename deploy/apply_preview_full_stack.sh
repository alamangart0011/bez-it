#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

cd "$APP_DIR"

bash deploy/apply_room_based_preview_ops_page.sh
bash deploy/apply_room_based_preview_bridge.sh
bash scripts/check_preview_full_stack.sh

echo "[OK] preview full stack applied"
echo "[INFO] open ${BASE_URL}/?preview=1"
