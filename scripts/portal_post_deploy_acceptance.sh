#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
LOGIN="${2:-${PORTAL_ACCEPT_LOGIN:-}}"
PASSWORD="${3:-${PORTAL_ACCEPT_PASSWORD:-}}"
TEXT_ROOM_ID="${4:-${PORTAL_ACCEPT_TEXT_ROOM_ID:-9400a110-a199-4361-bdf3-53647485675d}}"
MEETING_ROOM_ID="${5:-${PORTAL_ACCEPT_MEETING_ROOM_ID:-aa5b29e6-4f3e-4b3d-9d7f-e5d1512f5646}}"
VOICE_ROOM_ID="${6:-${PORTAL_ACCEPT_VOICE_ROOM_ID:-fa82cdc1-141c-4568-8219-020851a210aa}}"

if [ -z "$LOGIN" ] || [ -z "$PASSWORD" ]; then
  echo "[ERR] usage: portal_post_deploy_acceptance.sh <base_url> <login> <password> [text_room_id] [meeting_room_id] [voice_room_id]"
  echo "[ERR] or set PORTAL_ACCEPT_LOGIN and PORTAL_ACCEPT_PASSWORD"
  exit 1
fi

run_step() {
  local label="$1"
  shift
  echo "=== $label ==="
  "$@"
}

failure_bundle() {
  if [ -x scripts/portal_smoke_log_bundle.sh ]; then
    echo "[WARN] acceptance failed, collecting smoke bundle"
    scripts/portal_smoke_log_bundle.sh "$BASE_URL" || true
  fi
}

trap failure_bundle ERR

run_step web_entry scripts/smoke_web_entry.sh "$BASE_URL"
run_step post_deploy_check env BASE_URL="$BASE_URL" LOCAL_HEALTH_URL="$BASE_URL/api/health" RELEASE_URL="$BASE_URL/api/release" deploy/post_deploy_check.sh
run_step room_acceptance scripts/room_based_acceptance_smoke.sh "$BASE_URL" "$LOGIN" "$PASSWORD" "$TEXT_ROOM_ID" "$MEETING_ROOM_ID" "$VOICE_ROOM_ID"
run_step voice_verify scripts/portal_voice_verify.sh "$BASE_URL" "$LOGIN" "$PASSWORD" "$VOICE_ROOM_ID" "$MEETING_ROOM_ID"

echo "[OK] portal post deploy acceptance passed"
