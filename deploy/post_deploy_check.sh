#!/usr/bin/env bash
set -Eeuo pipefail
EXTERNAL_HEALTH_URL="${HEALTH_EXTERNAL_URL:-https://ai.voice.oboron-it.ru/api/health}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:8080/api/health}"
RELEASE_URL="${RELEASE_URL:-http://127.0.0.1:8080/api/release}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

assert_http_code() {
  local url="$1"
  local expected="$2"
  local actual=""
  actual="$(curl -sS -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$actual" != "$expected" ]]; then
    echo "[ERR] unexpected HTTP code for $url: got=$actual expected=$expected"
    return 1
  fi
  echo "[OK] $url -> $actual"
}
echo "[CHECK] local health"
curl -fsS "$LOCAL_HEALTH_URL"
echo
echo "[CHECK] release meta"
curl -fsS "$RELEASE_URL"
echo
echo "[CHECK] external health (best effort)"
curl -fsS "$EXTERNAL_HEALTH_URL" || echo "[WARN] external health still unavailable from current host context"
echo
echo "[OK] post-deploy checks complete"

echo "[CHECK] api live"
curl -fsS "$BASE_URL/api/live" >/dev/null
echo "[CHECK] api ready"
curl -fsS "$BASE_URL/api/ready" >/dev/null

echo "[CHECK] legacy endpoints return 410"
assert_http_code "$BASE_URL/api/ai" "410"
assert_http_code "$BASE_URL/api/e2e" "410"
assert_http_code "$BASE_URL/api/qr_phone_auth" "410"

echo "[CHECK] v18 protected endpoints return 401 without token"
assert_http_code "$BASE_URL/api/voice-sessions" "401"
assert_http_code "$BASE_URL/api/ai-jobs/jobs" "401"
