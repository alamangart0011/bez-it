#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

./deploy/recovery_orchestrator.sh
./deploy/generate_runtime_audit_bundle.sh

echo "[OK] recovery and bundle run completed"
