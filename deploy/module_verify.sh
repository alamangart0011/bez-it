#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"
APPLY_SQL="${APPLY_SQL:-0}"
TMP_DIR="${TMP_DIR:-/tmp/corpchat_module_verify}"

cd "$APP_DIR"
mkdir -p "$TMP_DIR"

if [ -z "$TOKEN" ]; then
  echo "[ERR] set TOKEN environment variable"
  exit 1
fi

check_public() {
  local label="$1"
  local url="$2"
  local code=""
  code="$(curl -sS -o "$TMP_DIR/out.json" -w '%{http_code}' "$url")"
  echo "[PUBLIC] $label -> $code"
  if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
    cat "$TMP_DIR/out.json" || true
    exit 1
  fi
}

check_auth() {
  local label="$1"
  local url="$2"
  local code=""
  code="$(curl -sS -o "$TMP_DIR/auth.json" -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$url")"
  echo "[AUTH] $label -> $code"
  if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
    cat "$TMP_DIR/auth.json" || true
    exit 1
  fi
}

if [ "$APPLY_SQL" = "1" ]; then
  ./deploy/apply_sql.sh
fi

check_public health "$BASE_URL/api/health"
check_public live "$BASE_URL/api/live"
check_public ready "$BASE_URL/api/ready"
check_public release "$BASE_URL/api/release"

check_auth me "$BASE_URL/api/me"
check_auth me_settings "$BASE_URL/api/me/settings"
check_auth auth_sessions "$BASE_URL/api/auth/sessions"
check_auth admin_overview "$BASE_URL/api/admin/overview"
check_auth admin_users "$BASE_URL/api/admin/users"
check_auth admin_rooms "$BASE_URL/api/admin/rooms"
check_auth admin_invitations "$BASE_URL/api/admin/invitations"
check_auth admin_system "$BASE_URL/api/admin/system"
check_auth admin_incidents "$BASE_URL/api/admin/incidents"
check_auth rooms "$BASE_URL/api/rooms"

ROOM_ID="$(curl -sS -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/rooms" | python3 -c 'import json,sys; data=json.load(sys.stdin); items=data if isinstance(data,list) else data.get("items") or data.get("rooms") or []; first=items[0] if items else {}; print(first.get("id", ""))')"

if [ -n "$ROOM_ID" ]; then
  check_auth room_detail "$BASE_URL/api/rooms/$ROOM_ID"
  check_auth room_messages "$BASE_URL/api/rooms/$ROOM_ID/messages"
  check_auth room_pins "$BASE_URL/api/rooms/$ROOM_ID/pins"
  check_auth room_files "$BASE_URL/api/rooms/$ROOM_ID/files"
  check_auth room_search "$BASE_URL/api/rooms/$ROOM_ID/search?q=%D0%BE%D0%B1%D1%89"
  check_auth voice_state "$BASE_URL/api/voice/rooms/$ROOM_ID/state"
  check_auth voice_requests "$BASE_URL/api/voice/rooms/$ROOM_ID/requests"
  check_auth meeting_room "$BASE_URL/api/meetings/rooms/$ROOM_ID"
else
  echo "[WARN] no room id available for detail probes"
fi

docker compose logs api --tail=60 || true

echo "[OK] module verification complete"
