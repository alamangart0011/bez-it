#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-/opt/messenger/contour-chat-jino-final}"
cd "$BASE"

docker compose -f docker-compose.runtime-api.yml down --remove-orphans
