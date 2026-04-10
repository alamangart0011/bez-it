#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"
APPLY_SQL="${APPLY_SQL:-0}"
ARTIFACT_ROOT="${ARTIFACT_ROOT:-$APP_DIR/artifacts/runtime_audit}"

cd "$APP_DIR"

APP_DIR="$APP_DIR" \
BASE_URL="$BASE_URL" \
TOKEN="$TOKEN" \
APPLY_SQL="$APPLY_SQL" \
ARTIFACT_ROOT="$ARTIFACT_ROOT" \
./deploy/build_runtime_audit_bundle.sh
