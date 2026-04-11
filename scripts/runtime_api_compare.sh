#!/usr/bin/env bash
set -Eeuo pipefail

LEGACY_BASE="${1:-http://127.0.0.1:8080}"
RUNTIME_BASE="${2:-http://127.0.0.1:${RUNTIME_API_SHADOW_PORT:-3002}}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

check_one() {
  local url="$1"
  local out="$2"
  local code
  code=$(curl -sS -o "$out" -w '%{http_code}' "$url" || true)
  echo "$code"
}

report() {
  local path="$1"
  local lcode rcode
  lcode=$(check_one "$LEGACY_BASE$path" "$TMP/legacy.json")
  rcode=$(check_one "$RUNTIME_BASE$path" "$TMP/runtime.json")
  echo "=== $path ==="
  echo "legacy=$lcode runtime=$rcode"
  echo "-- legacy sample --"
  head -c 240 "$TMP/legacy.json" 2>/dev/null || true
  printf '\n'
  echo "-- runtime sample --"
  head -c 240 "$TMP/runtime.json" 2>/dev/null || true
  printf '\n\n'
}

report /api/health
report /api/live
report /api/ready
report /api/release
report /api/meta
report /api/rooms
report /api/calls
report /api/transcripts
report /api/assistant
report /api/profile
report /api/admin
