#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

find frontend/src -maxdepth 2 \( \
  -name '*.before_preview_bridge' -o \
  -name '*.before_ops_page' -o \
  -name '*.before_ops_page_v2' -o \
  -name '*.before_html_reference_shell' \
\) -type f -print -delete || true

find frontend/src/preview -maxdepth 1 \( \
  -name 'SignalumRoomBasedPreviewV2.jsx' -o \
  -name 'SignalumRoomBasedPreviewOpsPageV2.jsx' \
\) -type f -print -delete || true

find deploy -maxdepth 1 \( \
  -name 'apply_room_based_preview_ops_page_v2.sh' -o \
  -name 'apply_room_based_preview_ops_page.sh' \
\) -type f -print -delete || true

find bin -maxdepth 1 \( \
  -name 'enable_room_based_preview_ops_page_v2.sh' -o \
  -name 'enable_room_based_preview_ops_page.sh' -o \
  -name 'restore_room_based_preview_ops_page.sh' -o \
  -name 'check_room_based_preview_ops_page.sh' \
\) -type f -print -delete || true

find scripts -maxdepth 1 \( \
  -name 'preview_ops_page_v2_smoke.sh' -o \
  -name 'preview_ops_page_smoke.sh' \
\) -type f -print -delete || true

echo '[OK] preview legacy files cleaned'
