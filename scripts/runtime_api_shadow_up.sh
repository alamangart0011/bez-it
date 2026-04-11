#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-/opt/messenger/contour-chat-jino-final}"
cd "$BASE"

docker compose -f docker-compose.runtime-api.yml up -d --build

for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${RUNTIME_API_SHADOW_PORT:-3002}/health" >/dev/null 2>&1; then
    echo "[OK] runtime api shadow healthy on attempt $i"
    break
  fi
  sleep 2
done

bash scripts/runtime_api_shadow_smoke.sh "http://127.0.0.1:${RUNTIME_API_SHADOW_PORT:-3002}"
