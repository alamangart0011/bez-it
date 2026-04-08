#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
OUT_DIR="${OUT_DIR:-/opt/messenger/backups/logs_$(date +%Y%m%d_%H%M%S)}"
mkdir -p "$OUT_DIR"
cd "$APP_DIR"

docker compose logs api --tail=400 > "$OUT_DIR/api.log" || true
docker compose logs web --tail=400 > "$OUT_DIR/web.log" || true
docker compose logs db --tail=400 > "$OUT_DIR/db.log" || true

if [ -f .env ]; then cp .env "$OUT_DIR/.env.snapshot"; fi
if [ -f manifest.json ]; then cp manifest.json "$OUT_DIR/manifest.json"; fi

echo "[OK] logs collected: $OUT_DIR"
