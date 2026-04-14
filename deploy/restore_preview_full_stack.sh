#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

bash bin/restore_room_based_preview_ops_page.sh || true
bash bin/restore_room_based_preview_bridge.sh || true
bash bin/check_room_based_preview_ops_page.sh || true
bash bin/check_room_based_preview_bridge.sh || true

echo "[OK] preview full stack restore finished"
