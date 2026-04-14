#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
OUT_DIR="${OUT_DIR:-/tmp}"
TS="$(date +%Y%m%d_%H%M%S)"
WORK_DIR="$OUT_DIR/preview_full_stack_state_$TS"
mkdir -p "$WORK_DIR"
cd "$APP_DIR"

capture() {
  local name="$1"
  shift
  {
    echo "### $name ###"
    "$@"
  } > "$WORK_DIR/${name}.txt" 2>&1 || true
}

capture bridge_status bash bin/check_room_based_preview_bridge.sh
capture ops_page_status bash bin/check_room_based_preview_ops_page.sh
capture bridge_smoke bash scripts/preview_bridge_smoke.sh
capture ops_page_smoke bash scripts/preview_ops_page_smoke.sh
capture full_stack_check bash scripts/check_preview_full_stack.sh
capture app_js bash -lc 'sed -n "1,80p" frontend/src/App.jsx'
capture app_preview_js bash -lc 'sed -n "1,80p" frontend/src/App.preview.jsx'
capture preview_files bash -lc 'find frontend/src/preview -maxdepth 1 -type f | sort'

ARCHIVE_PATH="$WORK_DIR.tar.gz"
tar -czf "$ARCHIVE_PATH" -C "$OUT_DIR" "$(basename "$WORK_DIR")"
echo "$ARCHIVE_PATH"
