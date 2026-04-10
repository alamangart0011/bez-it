#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
LOGIN="${LOGIN:-}"
PASSWORD="${PASSWORD:-}"

if [ -z "$LOGIN" ] || [ -z "$PASSWORD" ]; then
  echo "[ERR] set LOGIN and PASSWORD"
  exit 1
fi

TOKEN="$(curl -sS -X POST "$BASE_URL/api/auth/login" -H 'Content-Type: application/json' -d "{\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("accessToken", ""))')"

if [ -z "$TOKEN" ]; then
  echo "[ERR] token not received"
  exit 1
fi

TOKEN="$TOKEN" BASE_URL="$BASE_URL" ./scripts/one_command_backend.sh
