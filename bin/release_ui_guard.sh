#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/opt/messenger/contour-chat-jino-final}"
cd "$ROOT"

BANNED='Контур Связи|Участники не загружены\.'
if grep -RnaE "$BANNED" frontend/src/App.jsx frontend/src/App.room.jsx frontend/src/shared/brandingDefaults.js frontend/dist 2>/dev/null; then
  echo "GUARD_FAIL_BANNED_MARKERS"
  exit 1
fi

CID="$(docker compose ps -q web || true)"
CONTAINER_ASSET=""
if [ -n "$CID" ]; then
  CONTAINER_ASSET="$(docker exec "$CID" sh -lc 'grep -o "assets/index-[^\" ]*\.js" /usr/share/nginx/html/index.html || true' | head -n 1)"
fi

EXTERNAL_ASSET="$(curl -kfsS https://ai.voice.oboron-it.ru/ | grep -o 'assets/index-[^"]*\.js' | head -n 1 || true)"

if [ -n "$CONTAINER_ASSET" ] && [ -n "$EXTERNAL_ASSET" ] && [ "$CONTAINER_ASSET" != "$EXTERNAL_ASSET" ]; then
  echo "GUARD_FAIL_ASSET_NAME_MISMATCH"
  echo "CONTAINER_ASSET=$CONTAINER_ASSET"
  echo "EXTERNAL_ASSET=$EXTERNAL_ASSET"
  exit 1
fi

echo "GUARD_OK"
