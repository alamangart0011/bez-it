#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
LOGIN="${2:-${PORTAL_VERIFY_LOGIN:-}}"
PASSWORD="${3:-${PORTAL_VERIFY_PASSWORD:-}}"
VOICE_ROOM_ID="${4:-${PORTAL_VERIFY_VOICE_ROOM_ID:-fa82cdc1-141c-4568-8219-020851a210aa}}"
MEETING_ROOM_ID="${5:-${PORTAL_VERIFY_MEETING_ROOM_ID:-aa5b29e6-4f3e-4b3d-9d7f-e5d1512f5646}}"

if [ -z "$LOGIN" ] || [ -z "$PASSWORD" ]; then
  echo "[ERR] usage: portal_voice_verify.sh <base_url> <login> <password> [voice_room_id] [meeting_room_id]"
  echo "[ERR] or set PORTAL_VERIFY_LOGIN and PORTAL_VERIFY_PASSWORD"
  exit 1
fi

TMP_HEALTH="$(mktemp)"
TMP_RELEASE="$(mktemp)"
TMP_LOGIN="$(mktemp)"
TMP_RTC="$(mktemp)"
TMP_SOCKET="$(mktemp)"
TMP_VOICE_STATE="$(mktemp)"
TMP_VOICE_MEMBERS="$(mktemp)"
TMP_MEETING_MEMBERS="$(mktemp)"
trap 'rm -f "$TMP_HEALTH" "$TMP_RELEASE" "$TMP_LOGIN" "$TMP_RTC" "$TMP_SOCKET" "$TMP_VOICE_STATE" "$TMP_VOICE_MEMBERS" "$TMP_MEETING_MEMBERS"' EXIT

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

echo "[1/7] health"
request GET "$BASE_URL/api/health" "$TMP_HEALTH"

echo "[2/7] release"
request GET "$BASE_URL/api/release" "$TMP_RELEASE"

echo "[3/7] login"
request POST "$BASE_URL/api/auth/login" "$TMP_LOGIN" "" "{\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}"
TOKEN="$(python3 - "$TMP_LOGIN" <<'PY'
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    data = json.load(f)
print(data.get('accessToken', '') or data.get('token', ''))
PY
)"
[ -n "$TOKEN" ] || { echo '[ERR] access token not found'; cat "$TMP_LOGIN"; exit 1; }

echo "[4/7] rtc config"
request GET "$BASE_URL/api/rtc/config" "$TMP_RTC" "$TOKEN"

echo "[5/7] socket asset"
curl -fsSI "$BASE_URL/socket.io/socket.io.js" > "$TMP_SOCKET"

echo "[6/7] voice state"
request GET "$BASE_URL/api/voice/rooms/$VOICE_ROOM_ID/state" "$TMP_VOICE_STATE" "$TOKEN"

echo "[7/7] members"
request GET "$BASE_URL/api/rooms/$VOICE_ROOM_ID/members" "$TMP_VOICE_MEMBERS" "$TOKEN"
request GET "$BASE_URL/api/rooms/$MEETING_ROOM_ID/members" "$TMP_MEETING_MEMBERS" "$TOKEN"

echo "--- SUMMARY ---"
python3 - "$TMP_HEALTH" "$TMP_RELEASE" "$TMP_RTC" "$TMP_SOCKET" "$TMP_VOICE_STATE" "$TMP_VOICE_MEMBERS" "$TMP_MEETING_MEMBERS" <<'PY'
import json, sys
health = json.load(open(sys.argv[1], 'r', encoding='utf-8'))
release = json.load(open(sys.argv[2], 'r', encoding='utf-8'))
rtc = json.load(open(sys.argv[3], 'r', encoding='utf-8'))
socket_headers = open(sys.argv[4], 'r', encoding='utf-8').read().splitlines()
voice_state = json.load(open(sys.argv[5], 'r', encoding='utf-8'))
voice_members = json.load(open(sys.argv[6], 'r', encoding='utf-8'))
meeting_members = json.load(open(sys.argv[7], 'r', encoding='utf-8'))
status_line = socket_headers[0] if socket_headers else ''
print(json.dumps({
  'health_ok': health.get('ok', True),
  'release_version': release.get('releaseVersion') or release.get('release') or release.get('version'),
  'release_channel': release.get('releaseChannel') or release.get('channel'),
  'rtc_keys': sorted(list(rtc.keys())) if isinstance(rtc, dict) else [],
  'socket_status_line': status_line,
  'voice_state_count': len(voice_state) if isinstance(voice_state, list) else len(voice_state.get('participants', [])) if isinstance(voice_state, dict) else 0,
  'voice_members_count': len(voice_members) if isinstance(voice_members, list) else len(voice_members.get('items', [])) if isinstance(voice_members, dict) else 0,
  'meeting_members_count': len(meeting_members) if isinstance(meeting_members, list) else len(meeting_members.get('items', [])) if isinstance(meeting_members, dict) else 0
}, ensure_ascii=False, indent=2))
PY

echo "[OK] portal voice verify passed"
