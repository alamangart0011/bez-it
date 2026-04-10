#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:8080/api/health}"
RELEASE_URL="${RELEASE_URL:-http://127.0.0.1:8080/api/release}"
LIVE_URL="${LIVE_URL:-http://127.0.0.1:8080/api/live}"
READY_URL="${READY_URL:-http://127.0.0.1:8080/api/ready}"

cd "$APP_DIR"

echo "[STATUS] compose"
docker compose ps

echo "[STATUS] health"
curl -fsS "$LOCAL_HEALTH_URL" || echo "[WARN] local health unavailable"
echo

echo "[STATUS] release"
curl -fsS "$RELEASE_URL" || echo "[WARN] release endpoint unavailable"
echo

echo "[STATUS] live"
curl -fsS "$LIVE_URL" || echo "[WARN] live endpoint unavailable"
echo

echo "[STATUS] ready"
curl -fsS "$READY_URL" || echo "[WARN] ready endpoint unavailable"
echo

echo "[OK] status report complete"
