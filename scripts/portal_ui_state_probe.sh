#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
LOGIN="${2:-${PORTAL_PROBE_LOGIN:-}}"
PASSWORD="${3:-${PORTAL_PROBE_PASSWORD:-}}"
VOICE_ROOM_ID="${4:-${PORTAL_PROBE_VOICE_ROOM_ID:-fa82cdc1-141c-4568-8219-020851a210aa}}"
LOG_WINDOW="${PORTAL_PROBE_LOG_WINDOW:-10m}"

if [ -z "$LOGIN" ] || [ -z "$PASSWORD" ]; then
  echo "[ERR] usage: portal_ui_state_probe.sh <base_url> <login> <password> [voice_room_id]"
  echo "[ERR] or set PORTAL_PROBE_LOGIN and PORTAL_PROBE_PASSWORD"
  exit 1
fi

TMP_LOGIN="$(mktemp)"
TMP_RELEASE="$(mktemp)"
TMP_ROOMS="$(mktemp)"
TMP_MEMBERS="$(mktemp)"
TMP_VOICE_STATE="$(mktemp)"
TMP_RTC="$(mktemp)"
TMP_SOCKET="$(mktemp)"
trap 'rm -f "$TMP_LOGIN" "$TMP_RELEASE" "$TMP_ROOMS" "$TMP_MEMBERS" "$TMP_VOICE_STATE" "$TMP_RTC" "$TMP_SOCKET"' EXIT

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

echo "[1/8] login"
request POST "$BASE_URL/api/auth/login" "$TMP_LOGIN" "" "{\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}"
TOKEN="$(python3 - "$TMP_LOGIN" <<'PY'
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    data = json.load(f)
print(data.get('accessToken', '') or data.get('token', ''))
PY
)"
[ -n "$TOKEN" ] || { echo '[ERR] access token not found'; cat "$TMP_LOGIN"; exit 1; }

echo "[2/8] release"
request GET "$BASE_URL/api/release" "$TMP_RELEASE"

echo "[3/8] rooms"
request GET "$BASE_URL/api/rooms" "$TMP_ROOMS" "$TOKEN"

echo "[4/8] voice room members"
request GET "$BASE_URL/api/rooms/$VOICE_ROOM_ID/members" "$TMP_MEMBERS" "$TOKEN"

echo "[5/8] voice room state"
request GET "$BASE_URL/api/voice/rooms/$VOICE_ROOM_ID/state" "$TMP_VOICE_STATE" "$TOKEN"

echo "[6/8] rtc config"
request GET "$BASE_URL/api/rtc/config" "$TMP_RTC" "$TOKEN"

echo "[7/8] socket asset"
curl -fsSI "$BASE_URL/socket.io/socket.io.js" > "$TMP_SOCKET"

echo "[8/8] summary"
python3 - "$TMP_RELEASE" "$TMP_ROOMS" "$TMP_MEMBERS" "$TMP_VOICE_STATE" "$TMP_RTC" "$TMP_SOCKET" <<'PY'
import json, sys
release = json.load(open(sys.argv[1], 'r', encoding='utf-8'))
rooms = json.load(open(sys.argv[2], 'r', encoding='utf-8'))
members = json.load(open(sys.argv[3], 'r', encoding='utf-8'))
voice_state = json.load(open(sys.argv[4], 'r', encoding='utf-8'))
rtc = json.load(open(sys.argv[5], 'r', encoding='utf-8'))
socket_headers = open(sys.argv[6], 'r', encoding='utf-8').read().splitlines()
status_line = socket_headers[0] if socket_headers else ''
room_names = [r.get('name') for r in rooms] if isinstance(rooms, list) else [r.get('name') for r in rooms.get('items', [])]
member_count = len(members) if isinstance(members, list) else len(members.get('items', [])) if isinstance(members, dict) else 0
state_count = len(voice_state) if isinstance(voice_state, list) else len(voice_state.get('participants', [])) if isinstance(voice_state, dict) else 0
print(json.dumps({
  'release_version': release.get('releaseVersion') or release.get('release') or release.get('version'),
  'release_channel': release.get('releaseChannel') or release.get('channel'),
  'rooms_count': len(room_names),
  'room_names': room_names,
  'voice_members_count': member_count,
  'voice_state_count': state_count,
  'socket_status_line': status_line,
  'rtc_socket_path': rtc.get('socketPath') if isinstance(rtc, dict) else None
}, ensure_ascii=False, indent=2))
PY

if command -v docker >/dev/null 2>&1 && docker compose ps >/dev/null 2>&1; then
  echo "--- API LOGS (${LOG_WINDOW}) ---"
  docker compose logs api --since="$LOG_WINDOW" | grep -Ei 'rtc|voice|socket|peer|signal|join|leave' || true
fi

echo "[OK] portal ui state probe passed"
