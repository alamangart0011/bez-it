#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DOMAIN="${1:-ai.voice.oboron-it.ru}"

echo "=== HTTP health ==="
curl -i "http://${BASE_DOMAIN}/api/health" || true

echo "=== HTTPS home ==="
curl -k -i "https://${BASE_DOMAIN}/" || true

echo "=== HTTPS health ==="
curl -k -i "https://${BASE_DOMAIN}/api/health" || true

echo "=== HTTPS rooms ==="
curl -k -i "https://${BASE_DOMAIN}/api/rooms" || true
