#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

bash bin/check_room_based_preview_bridge.sh || true
bash bin/check_room_based_preview_ops_page.sh || true
bash scripts/preview_bridge_smoke.sh || true
bash scripts/preview_ops_page_smoke.sh || true

echo "[OK] preview full stack checks finished"
