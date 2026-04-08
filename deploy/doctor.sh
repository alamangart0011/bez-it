#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/health}"

if [ ! -d "$APP_DIR" ]; then
  echo "[ERR] baseline directory not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

test -f docker-compose.yml || { echo "[ERR] docker-compose.yml not found"; exit 1; }
test -f deploy/BASELINE.lock || { echo "[ERR] deploy/BASELINE.lock not found"; exit 1; }

grep -q 'RULE_SINGLE_DEPLOY_PATH=true' deploy/BASELINE.lock || {
  echo "[ERR] baseline lock file does not confirm single deploy path"
  exit 1
}

for nested in v14 v15 v16 v17 release releases; do
  if [ -d "$APP_DIR/$nested" ]; then
    echo "[WARN] nested catalog detected inside baseline: $nested"
  fi
done

if [ ! -f .env ]; then
  echo "[ERR] .env not found in baseline root"
  exit 1
fi

if command -v docker >/dev/null 2>&1; then
  echo "[OK] docker: $(docker --version)"
else
  echo "[ERR] docker command not found"
  exit 1
fi

if command -v curl >/dev/null 2>&1; then
  echo "[OK] curl: available"
else
  echo "[ERR] curl command not found"
  exit 1
fi

if docker compose config >/dev/null 2>&1; then
  echo "[OK] docker compose config: valid"
else
  echo "[ERR] docker compose config is invalid"
  exit 1
fi

if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
  echo "[OK] current health endpoint is reachable: $HEALTH_URL"
else
  echo "[WARN] current health endpoint is not responding yet: $HEALTH_URL"
fi

echo "[OK] baseline discipline check completed"
