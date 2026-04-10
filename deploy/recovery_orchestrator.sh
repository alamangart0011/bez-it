#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"
APPLY_SQL="${APPLY_SQL:-0}"

cd "$APP_DIR"

echo "[1/4] SQL parity report"
./scripts/sql_parity_report.sh

echo "[2/4] module probe with token"
TOKEN="$TOKEN" APPLY_SQL="$APPLY_SQL" BASE_URL="$BASE_URL" ./deploy/module_probe_with_token.sh

echo "[3/4] post deploy checks"
./deploy/post_deploy_check.sh

echo "[4/4] compose state"
docker compose ps

echo "[OK] recovery orchestrator completed"
