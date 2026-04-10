#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:8080/api/health}"
RELEASE_URL="${RELEASE_URL:-http://127.0.0.1:8080/api/release}"

cd "$APP_DIR"

echo "[PREFLIGHT] baseline discipline"
bash ./deploy/doctor.sh

echo "[PREFLIGHT] required files"
for path in \
  docker-compose.yml \
  deploy/BASELINE.lock \
  deploy/apply_sql.sh \
  deploy/post_deploy_check.sh \
  deploy/rollback.sh \
  scripts/smoke_api.sh; do
  test -f "$path" || { echo "[ERR] missing required file: $path"; exit 1; }
  echo "[OK] $path"
done

echo "[PREFLIGHT] sql catalog"
SQL_COUNT="$(find infra/sql -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
if [ "$SQL_COUNT" -lt 1 ]; then
  echo "[ERR] infra/sql catalog is empty"
  exit 1
fi
echo "[OK] sql files: $SQL_COUNT"

echo "[PREFLIGHT] docker compose config"
docker compose config >/dev/null

echo "[PREFLIGHT] runtime probe"
if curl -fsS "$LOCAL_HEALTH_URL" >/dev/null 2>&1; then
  echo "[OK] local health is reachable"
  curl -fsS "$RELEASE_URL" || true
  echo
else
  echo "[WARN] local health is not reachable yet"
fi

echo "[OK] preflight complete"
