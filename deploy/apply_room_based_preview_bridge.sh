#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

cd "$APP_DIR"

bash bin/enable_room_based_preview_bridge.sh
bash bin/check_room_based_preview_bridge.sh
bash scripts/preview_bridge_smoke.sh

echo "[OK] preview bridge applied"
echo "[INFO] open ${BASE_URL}/?preview=1"
