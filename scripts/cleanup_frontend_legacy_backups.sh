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

echo "[OK] frontend legacy backups cleaned"
