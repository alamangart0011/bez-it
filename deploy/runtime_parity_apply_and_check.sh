#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-$BASE_URL/api/health}"
LOCAL_RELEASE_URL="${LOCAL_RELEASE_URL:-$BASE_URL/api/release}"

cd "$APP_DIR"

echo "[1/6] baseline doctor"
./deploy/doctor.sh

echo "[2/6] apply SQL parity"
./deploy/apply_sql.sh

echo "[3/6] local health"
curl -fsS "$LOCAL_HEALTH_URL"
echo

echo "[4/6] release meta"
curl -fsS "$LOCAL_RELEASE_URL"
echo

echo "[5/6] protected runtime checks"
status_live="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/live")"
status_ready="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/ready")"
status_voice="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/voice-sessions")"
status_ai_jobs="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/ai-jobs/jobs")"
status_legacy_ai="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/ai")"
status_legacy_e2e="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/e2e")"

echo "live=$status_live ready=$status_ready voice_sessions=$status_voice ai_jobs=$status_ai_jobs legacy_ai=$status_legacy_ai legacy_e2e=$status_legacy_e2e"

test "$status_live" = "200"
test "$status_ready" = "200"
test "$status_voice" = "401"
test "$status_ai_jobs" = "401"
test "$status_legacy_ai" = "410"
test "$status_legacy_e2e" = "410"

echo "[6/6] smoke API"
./scripts/smoke_api.sh http://127.0.0.1:3001

echo "[OK] runtime parity apply/check completed"
