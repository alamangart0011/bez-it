#!/usr/bin/env bash
set -Eeuo pipefail

HOST="${1:-ai.voice.oboron-it.ru}"

echo "=== tcp 80 ==="
( timeout 5 bash -lc "</dev/tcp/${HOST}/80" && echo "[OK] 80 open" ) || echo "[ERR] 80 closed"

echo "=== tcp 443 ==="
( timeout 5 bash -lc "</dev/tcp/${HOST}/443" && echo "[OK] 443 open" ) || echo "[ERR] 443 closed"

echo "=== plain http ==="
curl -I "http://${HOST}" || true

echo "=== tls https ==="
curl -k -I "https://${HOST}" || true
