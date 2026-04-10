#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"
APPLY_SQL="${APPLY_SQL:-0}"

cd "$APP_DIR"

if [ -z "$TOKEN" ]; then
  echo "[ERR] set TOKEN environment variable"
  exit 1
fi

check() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /tmp/module_probe.out -w '%{http_code}' "$url")"
  echo "[CHECK] $label -> $code"
  if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
    echo "[ERR] $label failed"
    cat /tmp/module_probe.out || true
    exit 1
  fi
}

auth_check() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /tmp/module_probe_auth.out -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$url")"
  echo "[AUTH] $label -> $code"
  if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
    echo "[ERR] $label failed"
    cat /tmp/module_probe_auth.out || true
    exit 1
  fi
}

echo "[1/6] doctor"
./deploy/doctor.sh

if [ "$APPLY_SQL" = "1" ]; then
  echo "[2/6] apply SQL parity"
  ./deploy/apply_sql.sh
else
  echo "[2/6] apply SQL parity skipped"
fi

echo "[3/6] unauth runtime"
check health "$BASE_URL/api/health"
check live "$BASE_URL/api/live"
check ready "$BASE_URL/api/ready"
check release "$BASE_URL/api/release"

echo "[4/6] me/admin modules"
auth_check me "$BASE_URL/api/me"
auth_check me_settings "$BASE_URL/api/me/settings"
auth_check auth_sessions "$BASE_URL/api/auth/sessions"
auth_check admin_overview "$BASE_URL/api/admin/overview"
auth_check admin_users "$BASE_URL/api/admin/users"
auth_check admin_rooms "$BASE_URL/api/admin/rooms"
auth_check admin_invitations "$BASE_URL/api/admin/invitations"
auth_check admin_system "$BASE_URL/api/admin/system"
auth_check admin_incidents "$BASE_URL/api/admin/incidents"

echo "[5/6] rooms/voice modules"
auth_check rooms "$BASE_URL/api/rooms"

echo "[6/6] api logs tail"
docker compose logs api --tail=40 || true

echo "[OK] module probe with token completed"
