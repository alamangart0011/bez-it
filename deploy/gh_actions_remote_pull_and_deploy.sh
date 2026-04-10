#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
DEPLOY_REF="${DEPLOY_REF:-main}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/messenger/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_ROOT/github_actions_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_ROOT"
cd "$APP_DIR"

echo "[AUTO] host=$(hostname) user=$(whoami) dir=$APP_DIR ref=$DEPLOY_REF"

echo "[AUTO] backup -> $BACKUP_FILE"
tar \
  --exclude='./frontend/node_modules' \
  --exclude='./backend/node_modules' \
  --exclude='./frontend/dist' \
  --exclude='./.git' \
  -czf "$BACKUP_FILE" .

echo "[AUTO] git fetch"
git fetch --all --prune

echo "[AUTO] git reset --hard $DEPLOY_REF"
git reset --hard "$DEPLOY_REF"

echo "[AUTO] git clean"
git clean -fd

echo "[AUTO] run deploy"
APP_DIR="$APP_DIR" BACKUP_ROOT="$BACKUP_ROOT" ./deploy/deploy.sh

echo "[AUTO] done"
