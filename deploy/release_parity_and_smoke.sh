#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
EXTERNAL_HEALTH_URL="${EXTERNAL_HEALTH_URL:-}"

cd "$APP_DIR"

echo "[1/5] doctor"
./deploy/doctor.sh

echo "[2/5] apply SQL parity"
./deploy/apply_sql.sh

echo "[3/5] runtime parity"
./deploy/runtime_parity_apply_and_check.sh

echo "[4/5] smoke API"
./scripts/smoke_api.sh "$BASE_URL"

echo "[5/5] post deploy checks"
./deploy/post_deploy_check.sh

if [ -n "$EXTERNAL_HEALTH_URL" ]; then
  echo "[EXT] health -> $EXTERNAL_HEALTH_URL"
  curl -fsS "$EXTERNAL_HEALTH_URL" >/dev/null
fi

echo "[OK] release parity and smoke checks completed"
