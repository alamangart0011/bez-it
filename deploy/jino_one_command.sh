#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"
./deploy/doctor.sh
./deploy/deploy.sh
echo "[OK] hosting-final deploy sequence complete"
