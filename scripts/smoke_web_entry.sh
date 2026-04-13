#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"

check() {
  local label="$1"
  local url="$2"
  echo "[SMOKE-WEB] $label -> $url"
  curl -fsS "$url" >/dev/null
}

check "health" "$BASE_URL/api/health"
check "live" "$BASE_URL/api/live"
check "ready" "$BASE_URL/api/ready"
check "release" "$BASE_URL/api/release"

echo "[OK] web entry smoke passed"
