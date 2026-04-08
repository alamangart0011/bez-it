#!/usr/bin/env bash
set -Eeuo pipefail
EXTERNAL_HEALTH_URL="${HEALTH_EXTERNAL_URL:-https://ai.voice.oboron-it.ru/api/health}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:8080/api/health}"
RELEASE_URL="${RELEASE_URL:-http://127.0.0.1:8080/api/release}"
echo "[CHECK] local health"
curl -fsS "$LOCAL_HEALTH_URL"
echo
echo "[CHECK] release meta"
curl -fsS "$RELEASE_URL"
echo
echo "[CHECK] external health (best effort)"
curl -fsS "$EXTERNAL_HEALTH_URL" || echo "[WARN] external health still unavailable from current host context"
echo
echo "[OK] post-deploy checks complete"

echo "[CHECK] api live"
curl -fsS http://127.0.0.1:8080/api/live >/dev/null
echo "[CHECK] api ready"
curl -fsS http://127.0.0.1:8080/api/ready >/dev/null
