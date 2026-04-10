#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
DEPLOY_REF="${DEPLOY_REF:-main}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/messenger/backups}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/health}"
SMOKE_URL="${SMOKE_URL:-http://127.0.0.1:8080}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_ROOT"

cd "$APP_DIR"
OLD_REF="$(git rev-parse HEAD)"

echo "[FAST] host=$(hostname) user=$(whoami)"
echo "[FAST] old=$OLD_REF target=$DEPLOY_REF"

git fetch --all --prune
TARGET_REF="$(git rev-parse "$DEPLOY_REF")"

if [ "$OLD_REF" = "$TARGET_REF" ]; then
  echo "[FAST] already on target commit"
  exit 0
fi

CHANGED_FILES="$(git diff --name-only "$OLD_REF" "$TARGET_REF" || true)"
echo "[FAST] changed files:"
printf '%s\n' "$CHANGED_FILES"

needs_api=0
needs_web=0
needs_sql=0
meaningful=0

while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in
    docs/*|*.md|.gitignore)
      ;;
    infra/sql/*)
      meaningful=1
      needs_sql=1
      needs_api=1
      ;;
    backend/*)
      meaningful=1
      needs_api=1
      ;;
    frontend/*)
      meaningful=1
      needs_web=1
      ;;
    docker-compose.yml|deploy/*|scripts/*|.github/workflows/*|package*.json)
      meaningful=1
      needs_api=1
      needs_web=1
      ;;
    *)
      meaningful=1
      needs_api=1
      needs_web=1
      ;;
  esac
done <<< "$CHANGED_FILES"

BACKUP_FILE="$BACKUP_ROOT/fastlane_${TIMESTAMP}.tar.gz"
echo "[FAST] backup -> $BACKUP_FILE"
tar   --exclude='./frontend/node_modules'   --exclude='./backend/node_modules'   --exclude='./frontend/dist'   --exclude='./.git'   -czf "$BACKUP_FILE" .

git reset --hard "$TARGET_REF"
git clean -fd
chmod +x deploy/*.sh scripts/*.sh 2>/dev/null || true

if [ "$meaningful" -eq 0 ]; then
  echo "[FAST] docs-only change, no deploy needed"
  exit 0
fi

./deploy/doctor.sh

docker compose up -d db

services_to_build=()
services_to_up=()

if [ "$needs_api" -eq 1 ]; then
  services_to_build+=(api)
  services_to_up+=(api)
fi

if [ "$needs_web" -eq 1 ]; then
  services_to_build+=(web)
  services_to_up+=(web)
fi

if [ ${#services_to_build[@]} -gt 0 ]; then
  echo "[FAST] build: ${services_to_build[*]}"
  docker compose build "${services_to_build[@]}"
fi

if [ "$needs_sql" -eq 1 ]; then
  echo "[FAST] apply sql"
  ./deploy/apply_sql.sh
fi

if [ ${#services_to_up[@]} -gt 0 ]; then
  echo "[FAST] up: ${services_to_up[*]}"
  docker compose up -d "${services_to_up[@]}"
fi

OK=0
for _ in $(seq 1 20); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    OK=1
    break
  fi
  sleep 2
done

if [ "$OK" -ne 1 ]; then
  echo "[FAST][ERR] health failed"
  APP_DIR="$APP_DIR" ./deploy/rollback.sh "$BACKUP_FILE"
  exit 1
fi

echo "[FAST] smoke"
./scripts/smoke_api.sh "$SMOKE_URL"

echo "[FAST] post deploy"
./deploy/post_deploy_check.sh

echo "[FAST] result"
docker compose ps

echo "[FAST][OK] deploy complete"
