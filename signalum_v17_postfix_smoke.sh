#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
LOGIN="${2:-admin@corpchat.local}"
PASSWORD="${3:-Admin@12345!}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

req() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local auth="${4:-}"
  local out="$5"
  if [ -n "$auth" ]; then
    curl -sS -X "$method" "$url" -H "Authorization: Bearer $auth" -H 'Content-Type: application/json' ${body:+-d "$body"} -o "$out" -w '%{http_code}'
  else
    curl -sS -X "$method" "$url" -H 'Content-Type: application/json' ${body:+-d "$body"} -o "$out" -w '%{http_code}'
  fi
}

must_200() {
  local label="$1"; shift
  local code="$1"; shift
  if [ "$code" != "200" ]; then
    echo "[ERR] $label -> expected 200, got $code"
    cat "$1" || true
    exit 1
  fi
  echo "[OK] $label"
}

echo "[SMOKE+] health/live/ready/release"
for path in /api/health /api/live /api/ready /api/release; do
  code=$(curl -sS -o "$TMP/out.json" -w '%{http_code}' "$BASE_URL$path")
  must_200 "$path" "$code" "$TMP/out.json"
done

echo "[SMOKE+] login"
LOGIN_CODE=$(curl -sS -X POST "$BASE_URL/api/auth/login" -H 'Content-Type: application/json' -d "{\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}" -o "$TMP/login.json" -w '%{http_code}')
must_200 "login" "$LOGIN_CODE" "$TMP/login.json"
TOKEN=$(python3 - <<'PY' "$TMP/login.json"
import json,sys
obj=json.load(open(sys.argv[1],encoding='utf-8'))
print(obj.get('accessToken',''))
PY
)
if [ -z "$TOKEN" ]; then
  echo "[ERR] login returned no accessToken"
  cat "$TMP/login.json"
  exit 1
fi

echo "[SMOKE+] authenticated endpoints"
for path in /api/me /api/me/settings /api/admin/overview /api/admin/users /api/admin/system /api/admin/invitations /api/admin/incidents /api/admin/rooms /api/rooms; do
  code=$(curl -sS "$BASE_URL$path" -H "Authorization: Bearer $TOKEN" -o "$TMP/out.json" -w '%{http_code}')
  must_200 "$path" "$code" "$TMP/out.json"
done

echo "[SMOKE+] update settings"
SETTINGS_PAYLOAD='{"theme":"dark","notificationsEnabled":true,"soundEnabled":true,"desktopNotifications":true,"compactMode":false,"enterToSend":true,"pushToTalk":false,"voiceInputDevice":null,"voiceOutputDevice":null,"fontScale":"normal","highContrast":false,"reduceMotion":false}'
code=$(curl -sS -X PUT "$BASE_URL/api/me/settings" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$SETTINGS_PAYLOAD" -o "$TMP/settings.json" -w '%{http_code}')
must_200 "PUT /api/me/settings" "$code" "$TMP/settings.json"

echo "[SMOKE+] create invitation"
EMAIL="smoke.$(date +%s)@example.local"
INV_PAYLOAD="{\"email\":\"$EMAIL\",\"role\":\"member\",\"note\":\"smoke\",\"expiresDays\":14}"
code=$(curl -sS -X POST "$BASE_URL/api/admin/invitations" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$INV_PAYLOAD" -o "$TMP/invite.json" -w '%{http_code}')
must_200 "POST /api/admin/invitations" "$code" "$TMP/invite.json"

echo "[OK] smoke+ passed"
