#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:${RUNTIME_API_SHADOW_PORT:-3002}}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

must_200() {
  local label="$1"
  local code="$2"
  local file="$3"
  if [ "$code" != "200" ]; then
    echo "[ERR] $label -> expected 200, got $code"
    cat "$file" || true
    exit 1
  fi
  echo "[OK] $label"
}

for path in /health /api/meta /api/rooms /api/calls /api/transcripts /api/assistant /api/profile /api/admin; do
  code=$(curl -sS -o "$TMP/out.json" -w '%{http_code}' "$BASE_URL$path")
  must_200 "$path" "$code" "$TMP/out.json"
done

echo "[OK] runtime api shadow smoke passed"
