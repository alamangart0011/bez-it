#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:3001}"

check() {
  local label="$1"
  local url="$2"
  echo "[SMOKE] $label -> $url"
  curl -fsS "$url" >/dev/null
}

check "health" "$BASE_URL/api/health"
check "live" "$BASE_URL/api/live"
check "ready" "$BASE_URL/api/ready"
check "release" "$BASE_URL/api/release"

echo "[SMOKE] 404 contract"
STATUS="$(curl -s -o /tmp/corpchat_404.json -w '%{http_code}' "$BASE_URL/api/not-existing")"
if [ "$STATUS" != "404" ]; then
  echo "[ERR] expected 404, got $STATUS"
  exit 1
fi

echo "[OK] smoke checks passed"
