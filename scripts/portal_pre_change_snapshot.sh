#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
OUT_DIR="${2:-${PORTAL_SNAPSHOT_OUT_DIR:-/tmp}}"
TS="$(date +%Y%m%d_%H%M%S)"
WORK_DIR="${OUT_DIR%/}/portal_pre_change_snapshot_${TS}"
ARCHIVE_PATH="${WORK_DIR}.tar.gz"

mkdir -p "$WORK_DIR"

capture() {
  local name="$1"
  shift
  {
    echo "### $name ###"
    "$@"
  } > "$WORK_DIR/${name}.txt" 2>&1 || true
}

capture health curl -fsS "$BASE_URL/api/health"
capture release curl -fsS "$BASE_URL/api/release"
capture live curl -fsS "$BASE_URL/api/live"
capture ready curl -fsS "$BASE_URL/api/ready"
capture web_index bash -lc "curl -fsS '$BASE_URL/' | head -n 120"
capture asset_refs bash -lc "curl -fsS '$BASE_URL/' | grep -o 'assets/index-[^\" ]*\\.js' || true"
capture socket_headers curl -fsSI "$BASE_URL/socket.io/socket.io.js"

if command -v docker >/dev/null 2>&1 && docker compose ps >/dev/null 2>&1; then
  capture docker_compose_ps docker compose ps
  capture docker_compose_config docker compose config
  capture docker_compose_logs_api docker compose logs api --tail=120
  capture docker_compose_logs_web docker compose logs web --tail=120
  capture docker_compose_logs_db docker compose logs db --tail=120
fi

if [ -f .env ]; then
  grep -E '^(APP_NAME|RELEASE_VERSION|RELEASE_CHANNEL|HEALTH_EXTERNAL_URL|STUN_|TURN_|SOCKET_)=' .env > "$WORK_DIR/env_safe.txt" || true
fi

cat > "$WORK_DIR/README.txt" <<EOF
portal pre-change snapshot
created_at=$TS
base_url=$BASE_URL
archive_path=$ARCHIVE_PATH
EOF

tar -czf "$ARCHIVE_PATH" -C "$OUT_DIR" "$(basename "$WORK_DIR")"

echo "$ARCHIVE_PATH"
