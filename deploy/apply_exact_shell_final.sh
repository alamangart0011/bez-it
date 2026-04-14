#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

cd "$APP_DIR"

if [ -f tools/patch_exact_shell_copy_and_metrics.py ]; then
  python3 tools/patch_exact_shell_copy_and_metrics.py
fi

bash deploy/finalize_exact_shell_cleanup.sh
bash scripts/verify_exact_shell_entrypoints.sh

echo "[OK] exact shell final apply completed"
echo "[INFO] open ${BASE_URL}/?preview=1"
