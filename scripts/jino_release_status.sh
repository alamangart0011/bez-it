#!/usr/bin/env bash
set -Eeuo pipefail

HOST="${1:-ai.voice.oboron-it.ru}"

echo "=== SIGNALUM sandbox status ==="
echo "host=${HOST}"

echo "[1] http api health"
curl -i "http://${HOST}/api/health" || true

echo "[2] https home"
curl -k -i "https://${HOST}/" || true

echo "[3] https api health"
curl -k -i "https://${HOST}/api/health" || true

echo "[4] https rooms"
curl -k -i "https://${HOST}/api/rooms" || true
