#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

APP_MAIN="frontend/src/App.jsx"
APP_PREVIEW="frontend/src/App.preview.jsx"

[ -f "$APP_MAIN" ] || { echo "[ERR] missing $APP_MAIN"; exit 1; }
[ -f "$APP_PREVIEW" ] || { echo "[ERR] missing $APP_PREVIEW"; exit 1; }

grep -q "SignalumRoomBasedPreviewHtmlReferencePage" "$APP_MAIN" || { echo "[ERR] App.jsx is not wired to exact shell"; exit 1; }
grep -q "SignalumRoomBasedPreviewHtmlReferencePage" "$APP_PREVIEW" || { echo "[ERR] App.preview.jsx is not wired to exact shell"; exit 1; }

ASSET="$(find frontend/dist/assets -maxdepth 1 -type f -name 'index-*.js' | head -n 1 || true)"
[ -n "$ASSET" ] || { echo "[ERR] compiled asset not found"; exit 1; }

grep -aq "Комнаты, люди, команды" "$ASSET" || { echo "[ERR] bundle missing marker: Комнаты, люди, команды"; exit 1; }
grep -aq "Диспетчерская рабочего дня" "$ASSET" || { echo "[ERR] bundle missing marker: Диспетчерская рабочего дня"; exit 1; }
grep -aq "Поиск" "$ASSET" || { echo "[ERR] bundle missing marker: Поиск"; exit 1; }

echo "[OK] exact shell entrypoints and bundle markers verified"
