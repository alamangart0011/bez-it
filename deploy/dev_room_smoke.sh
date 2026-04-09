#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
LOGIN="${LOGIN:-admin@corpchat.local}"
PASSWORD="${PASSWORD:-admin123}"

echo "[1/7] docker compose up -d --build"
docker compose up -d --build

echo "[2/7] docker compose ps"
docker compose ps

echo "[3/7] health"
curl -fsS "$BASE_URL/api/health" | jq .

echo "[4/7] release"
curl -fsS "$BASE_URL/api/release" | jq .

echo "[5/7] post deploy check"
./deploy/post_deploy_check.sh

echo "[6/7] login and token"
TOKEN="$(curl -fsS -X POST "$BASE_URL/api/auth/login" -H 'Content-Type: application/json' -d "{\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}" | jq -r '.accessToken')"
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "[ERR] login failed: empty token"
  exit 1
fi

echo "[7/7] room flow"
ROOMS_JSON="$(curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/rooms")"
echo "$ROOMS_JSON" | jq .

ROOM_ID="$(echo "$ROOMS_JSON" | jq -r '.[0].id // empty')"
if [[ -z "$ROOM_ID" ]]; then
  echo "[INFO] no rooms found, creating one"
  ROOM_ID="$(curl -fsS -X POST "$BASE_URL/api/rooms" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"Комната команды","kind":"group","isPrivate":false}' | jq -r '.id')"
fi

if [[ -z "$ROOM_ID" || "$ROOM_ID" == "null" ]]; then
  echo "[ERR] room id is empty"
  exit 1
fi

echo "[INFO] using room: $ROOM_ID"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/rooms/$ROOM_ID" | jq .
curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/rooms/$ROOM_ID/members" | jq .

echo "[OK] dev room smoke completed"
