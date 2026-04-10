#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"

cd "$APP_DIR"

echo "[VERIFY] preflight"
./deploy/preflight.sh

echo "[VERIFY] runtime parity"
./deploy/runtime_parity.sh

echo "[VERIFY] smoke"
./scripts/smoke_api.sh "$BASE_URL"

echo "[VERIFY] post deploy checks"
./deploy/post_deploy_check.sh

if [ -n "$TOKEN" ]; then
  echo "[VERIFY] protected module probe"
  TOKEN="$TOKEN" BASE_URL="$BASE_URL" APPLY_SQL=0 ./deploy/module_probe_with_token.sh
else
  echo "[WARN] TOKEN is empty, protected module probe skipped"
fi

echo "[VERIFY] status report"
./deploy/status_report.sh

echo "[OK] verify complete"
