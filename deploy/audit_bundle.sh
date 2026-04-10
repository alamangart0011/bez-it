#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
OUTPUT_DIR="${OUTPUT_DIR:-$APP_DIR/audit_bundle}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/health}"
RELEASE_URL="${RELEASE_URL:-http://127.0.0.1:8080/api/release}"
STAMP="$(date +%Y%m%d_%H%M%S)"

cd "$APP_DIR"
mkdir -p "$OUTPUT_DIR"

docker compose ps > "$OUTPUT_DIR/docker_ps_${STAMP}.txt"
docker compose config > "$OUTPUT_DIR/docker_compose_config_${STAMP}.txt"
docker compose logs api --tail=200 > "$OUTPUT_DIR/api_logs_${STAMP}.txt" || true
docker compose logs web --tail=200 > "$OUTPUT_DIR/web_logs_${STAMP}.txt" || true
docker compose logs db --tail=200 > "$OUTPUT_DIR/db_logs_${STAMP}.txt" || true
curl -fsS "$HEALTH_URL" > "$OUTPUT_DIR/health_${STAMP}.json" || echo '{"ok":false}' > "$OUTPUT_DIR/health_${STAMP}.json"
curl -fsS "$RELEASE_URL" > "$OUTPUT_DIR/release_${STAMP}.json" || echo '{"ok":false}' > "$OUTPUT_DIR/release_${STAMP}.json"
cp deploy/BASELINE.lock "$OUTPUT_DIR/baseline_lock_${STAMP}.txt"

echo "[OK] audit bundle complete: $OUTPUT_DIR"
