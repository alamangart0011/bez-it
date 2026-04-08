#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/messenger/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_ROOT/corpchat_baseline_${TIMESTAMP}.tar.gz"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/health}"

mkdir -p "$BACKUP_ROOT"
cd "$APP_DIR"

./deploy/doctor.sh

echo "[1/8] backup -> $BACKUP_FILE"
tar \
  --exclude='./frontend/node_modules' \
  --exclude='./backend/node_modules' \
  --exclude='./frontend/dist' \
  --exclude='./.git' \
  -czf "$BACKUP_FILE" .

echo "[2/8] stop current containers"
docker compose down --remove-orphans || true

echo "[3/9] build"
docker compose build --pull

echo "[4/9] start"
docker compose up -d

echo "[5/9] schema sync"
./deploy/apply_sql.sh

echo "[6/9] health wait"
OK=0
for _ in $(seq 1 25); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    OK=1
    break
  fi
  sleep 3
done

if [ "$OK" -ne 1 ]; then
  echo "[ERR] health failed, start rollback"
  APP_DIR="$APP_DIR" ./deploy/rollback.sh "$BACKUP_FILE"
  exit 1
fi

echo "[7/9] smoke"
./scripts/smoke_api.sh http://127.0.0.1:3001

echo "[8/9] post deploy checks"
./deploy/post_deploy_check.sh

echo "[9/9] result"
docker compose ps

echo "[OK] deploy complete"
echo "[INFO] backup saved at: $BACKUP_FILE"
