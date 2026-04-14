#!/usr/bin/env bash
set -Eeuo pipefail

LOCAL_BASE_URL="${1:-http://127.0.0.1:8080}"
EXTERNAL_BASE_URL="${2:-https://ai.voice.oboron-it.ru}"

LOCAL_HTML="$(mktemp)"
EXTERNAL_HTML="$(mktemp)"
trap 'rm -f "$LOCAL_HTML" "$EXTERNAL_HTML"' EXIT

curl -fsS "$LOCAL_BASE_URL/?preview=1" > "$LOCAL_HTML"
curl -fsS "$EXTERNAL_BASE_URL/?preview=1" > "$EXTERNAL_HTML"

LOCAL_ASSET="$(grep -o 'assets/index-[^" ]*\.js' "$LOCAL_HTML" | head -n 1 || true)"
EXTERNAL_ASSET="$(grep -o 'assets/index-[^" ]*\.js' "$EXTERNAL_HTML" | head -n 1 || true)"

printf 'LOCAL_ASSET=%s
' "$LOCAL_ASSET"
printf 'EXTERNAL_ASSET=%s
' "$EXTERNAL_ASSET"

if [ -z "$LOCAL_ASSET" ] || [ -z "$EXTERNAL_ASSET" ]; then
  echo "[ERR] failed to resolve one of preview assets"
  exit 1
fi

if [ "$LOCAL_ASSET" != "$EXTERNAL_ASSET" ]; then
  echo "[WARN] local and external preview assets differ"
  exit 2
fi

echo "[OK] preview v2 live asset is aligned"
