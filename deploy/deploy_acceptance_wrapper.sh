#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
ACCEPT_LOGIN="${PORTAL_ACCEPT_LOGIN:-${ACCEPT_LOGIN:-}}"
ACCEPT_PASS="${PORTAL_ACCEPT_PASS:-${ACCEPT_PASS:-}}"

cd "$APP_DIR"

./deploy/deploy.sh

if [ -n "$ACCEPT_LOGIN" ] && [ -n "$ACCEPT_PASS" ]; then
  echo "[CHAIN] running portal post-deploy acceptance"
  PORTAL_ACCEPT_LOGIN="$ACCEPT_LOGIN" \
  PORTAL_ACCEPT_PASSWORD="$ACCEPT_PASS" \
  ./scripts/portal_post_deploy_acceptance.sh "$BASE_URL" "$ACCEPT_LOGIN" "$ACCEPT_PASS"
else
  echo "[WARN] acceptance credentials not set; chained acceptance skipped"
  echo "[HINT] set PORTAL_ACCEPT_LOGIN and PORTAL_ACCEPT_PASS to enable full post-deploy acceptance"
fi

echo "[OK] deploy_acceptance_wrapper complete"
