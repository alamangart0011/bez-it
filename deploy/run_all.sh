#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"
OUTPUT_DIR="${OUTPUT_DIR:-$APP_DIR/audit_bundle}"

cd "$APP_DIR"

echo "[RUN ALL] preflight"
./deploy/preflight.sh

echo "[RUN ALL] deploy"
./deploy/deploy.sh

echo "[RUN ALL] verify"
TOKEN="$TOKEN" BASE_URL="$BASE_URL" ./deploy/verify.sh

echo "[RUN ALL] audit bundle"
OUTPUT_DIR="$OUTPUT_DIR" ./deploy/audit_bundle.sh

echo "[RUN ALL] status report"
./deploy/status_report.sh

echo "[OK] one-command runner complete"
