#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
EXTERNAL_BASE_URL="${EXTERNAL_BASE_URL:-https://ai.voice.oboron-it.ru}"
RUN_SNAPSHOT="${RUN_SNAPSHOT:-1}"
RUN_DRIFT_WATCH="${RUN_DRIFT_WATCH:-1}"
ACCEPT_LOGIN="${PORTAL_ACCEPT_LOGIN:-${ACCEPT_LOGIN:-}}"
ACCEPT_PASS="${PORTAL_ACCEPT_PASS:-${ACCEPT_PASS:-}}"

cd "$APP_DIR"

bundle_on_error() {
  if [ -x scripts/portal_smoke_log_bundle.sh ]; then
    echo "[WARN] full fastpath failed, collecting smoke bundle"
    scripts/portal_smoke_log_bundle.sh "$BASE_URL" || true
  fi
}

trap bundle_on_error ERR

if [ "$RUN_SNAPSHOT" = "1" ] && [ -x scripts/portal_pre_change_snapshot.sh ]; then
  echo "[STEP] pre-change snapshot"
  scripts/portal_pre_change_snapshot.sh "$BASE_URL" || true
fi

echo "[STEP] deploy + chained acceptance"
PORTAL_ACCEPT_LOGIN="$ACCEPT_LOGIN" \
PORTAL_ACCEPT_PASS="$ACCEPT_PASS" \
BASE_URL="$BASE_URL" \
./deploy/deploy_acceptance_wrapper.sh

if [ "$RUN_DRIFT_WATCH" = "1" ] && [ -x scripts/portal_release_drift_watch.sh ]; then
  echo "[STEP] release drift watch"
  scripts/portal_release_drift_watch.sh "$BASE_URL" "$EXTERNAL_BASE_URL"
fi

echo "[OK] deploy_full_fastpath complete"
