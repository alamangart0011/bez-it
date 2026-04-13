#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
LOGIN="${2:-${ROOM_BASED_LOGIN:-}}"
PASSWORD="${3:-${ROOM_BASED_PASSWORD:-}}"
TEXT_ROOM_ID="${4:-9400a110-a199-4361-bdf3-53647485675d}"
MEETING_ROOM_ID="${5:-aa5b29e6-4f3e-4b3d-9d7f-e5d1512f5646}"
VOICE_ROOM_ID="${6:-fa82cdc1-141c-4568-8219-020851a210aa}"

if [ -z "$LOGIN" ] || [ -z "$PASSWORD" ]; then
  echo "[ERR] usage: room_based_acceptance_smoke.sh <base_url> <login> <password> [text_room_id] [meeting_room_id] [voice_room_id]"
  echo "[ERR] or set ROOM_BASED_LOGIN and ROOM_BASED_PASSWORD"
  exit 1
fi

TMP_LOGIN="$(mktemp)"
TMP_ROOMS="$(mktemp)"
TMP_ADMIN_ROOMS="$(mktemp)"
TMP_MESSAGES="$(mktemp)"
TMP_POST_MESSAGE="$(mktemp)"
TMP_VOICE_STATE="$(mktemp)"
trap 'rm -f "$TMP_LOGIN" "$TMP_ROOMS" "$TMP_ADMIN_ROOMS" "$TMP_MESSAGES" "$TMP_POST_MESSAGE" "$TMP_VOICE_STATE"' EXIT

request() {
  local method="$1"
  local url="$2"
  local output="$3"
  local token="${4:-}"
  local body="${5:-}"
  if [ -n "$token" ] && [ -n "$body" ]; then
    curl -fsS -o "$output" -X "$method" "$url" -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d "$body"
  elif [ -n "$token" ]; then
    curl -fsS -o "$output" -X "$method" "$url" -H "Authorization: Bearer $token"
  elif [ -n "$body" ]; then
    curl -fsS -o "$output" -X "$method" "$url" -H 'Content-Type: application/json' -d "$body"
  else
    curl -fsS -o "$output" -X "$method" "$url"
  fi
}

echo "[1/6] login"
request POST "$BASE_URL/api/auth/login" "$TMP_LOGIN" "" "{\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}"
TOKEN="$(python3 - "$TMP_LOGIN" <<'PY'
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    data = json.load(f)
print(data.get('accessToken', ''))
PY
)"
[ -n "$TOKEN" ] || { echo '[ERR] access token not found'; cat "$TMP_LOGIN"; exit 1; }

echo "[2/6] rooms"
request GET "$BASE_URL/api/rooms" "$TMP_ROOMS" "$TOKEN"

echo "[3/6] admin rooms"
request GET "$BASE_URL/api/admin/rooms" "$TMP_ADMIN_ROOMS" "$TOKEN"

echo "[4/6] text room messages"
request GET "$BASE_URL/api/rooms/$TEXT_ROOM_ID/messages" "$TMP_MESSAGES" "$TOKEN"

echo "[5/6] post smoke message"
request POST "$BASE_URL/api/rooms/$TEXT_ROOM_ID/messages" "$TMP_POST_MESSAGE" "$TOKEN" "{\"text\":\"acceptance smoke message\"}"

echo "[6/6] voice state"
request GET "$BASE_URL/api/voice/rooms/$VOICE_ROOM_ID/state" "$TMP_VOICE_STATE" "$TOKEN"

echo "--- SUMMARY ---"
python3 - "$TMP_ROOMS" "$TMP_ADMIN_ROOMS" "$TMP_MESSAGES" "$TMP_POST_MESSAGE" "$TMP_VOICE_STATE" <<'PY'
import json, sys
rooms = json.load(open(sys.argv[1], 'r', encoding='utf-8'))
admin_rooms = json.load(open(sys.argv[2], 'r', encoding='utf-8'))
messages = json.load(open(sys.argv[3], 'r', encoding='utf-8'))
posted = json.load(open(sys.argv[4], 'r', encoding='utf-8'))
voice = json.load(open(sys.argv[5], 'r', encoding='utf-8'))
print(json.dumps({
  'rooms_count': len(rooms),
  'active_room_names': [r.get('name') for r in rooms],
  'admin_rooms_count': len(admin_rooms),
  'messages_count': len(messages),
  'posted_message_id': posted.get('id'),
  'voice_participants_count': len(voice)
}, ensure_ascii=False, indent=2))
PY

echo "[OK] room-based acceptance smoke passed"
