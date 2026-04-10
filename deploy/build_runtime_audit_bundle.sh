#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"
APPLY_SQL="${APPLY_SQL:-0}"
ARTIFACT_ROOT="${ARTIFACT_ROOT:-$APP_DIR/artifacts/runtime_audit}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="$ARTIFACT_ROOT/$STAMP"

mkdir -p "$OUT_DIR"
cd "$APP_DIR"

echo "[1/6] compose state"
docker compose ps > "$OUT_DIR/01_compose_ps.txt" 2>&1 || true

echo "[2/6] sql parity report"
./scripts/sql_parity_report.sh > "$OUT_DIR/02_sql_parity_report.txt" 2>&1 || true

echo "[3/6] smoke api"
./scripts/smoke_api.sh "$BASE_URL" > "$OUT_DIR/03_smoke_api.txt" 2>&1 || true

echo "[4/6] module probe with token"
if [ -n "$TOKEN" ]; then
  TOKEN="$TOKEN" APPLY_SQL="$APPLY_SQL" BASE_URL="$BASE_URL" ./deploy/module_probe_with_token.sh > "$OUT_DIR/04_module_probe_with_token.txt" 2>&1 || true
else
  echo "TOKEN not provided; module probe skipped" > "$OUT_DIR/04_module_probe_with_token.txt"
fi

echo "[5/6] post deploy check"
./deploy/post_deploy_check.sh > "$OUT_DIR/05_post_deploy_check.txt" 2>&1 || true

echo "[6/6] logs"
docker compose logs api --tail=150 > "$OUT_DIR/06_api_logs_tail.txt" 2>&1 || true
docker compose logs db --tail=150 > "$OUT_DIR/07_db_logs_tail.txt" 2>&1 || true
docker compose logs web --tail=150 > "$OUT_DIR/08_web_logs_tail.txt" 2>&1 || true

cat > "$OUT_DIR/00_manifest.txt" <<EOF
APP_DIR=$APP_DIR
BASE_URL=$BASE_URL
APPLY_SQL=$APPLY_SQL
STAMP=$STAMP
OUT_DIR=$OUT_DIR
EOF

ARCHIVE_PATH="$ARTIFACT_ROOT/runtime_audit_$STAMP.tar.gz"
tar -czf "$ARCHIVE_PATH" -C "$ARTIFACT_ROOT" "$STAMP"

echo "$ARCHIVE_PATH" > "$OUT_DIR/09_archive_path.txt"
echo "[OK] runtime audit bundle created: $ARCHIVE_PATH"
