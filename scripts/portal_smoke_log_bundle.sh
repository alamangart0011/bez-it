#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"
LOG_WINDOW="${2:-${PORTAL_BUNDLE_LOG_WINDOW:-15m}}"
OUT_DIR="${3:-${PORTAL_BUNDLE_OUT_DIR:-/tmp}}"
TS="$(date +%Y%m%d_%H%M%S)"
WORK_DIR="${OUT_DIR%/}/portal_smoke_bundle_${TS}"
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

capture curl_health curl -fsS "$BASE_URL/api/health"
capture curl_release curl -fsS "$BASE_URL/api/release"
capture curl_live curl -fsS "$BASE_URL/api/live"
capture curl_ready curl -fsS "$BASE_URL/api/ready"
capture socket_headers curl -fsSI "$BASE_URL/socket.io/socket.io.js"

if command -v docker >/dev/null 2>&1 && docker compose ps >/dev/null 2>&1; then
  capture docker_compose_ps docker compose ps
  capture docker_compose_logs_api docker compose logs api --since="$LOG_WINDOW"
  capture docker_compose_logs_web docker compose logs web --since="$LOG_WINDOW"
  capture docker_compose_logs_db docker compose logs db --since="$LOG_WINDOW"
fi

capture env_safe bash -lc 'printf "BASE_URL=%s\nLOG_WINDOW=%s\nPWD=%s\n" "$0" "$1" "$PWD"' "$BASE_URL" "$LOG_WINDOW"

cat > "$WORK_DIR/README.txt" <<EOF
portal smoke log bundle
created_at=$TS
base_url=$BASE_URL
log_window=$LOG_WINDOW
archive_path=$ARCHIVE_PATH
EOF

tar -czf "$ARCHIVE_PATH" -C "$OUT_DIR" "$(basename "$WORK_DIR")"

echo "$ARCHIVE_PATH"
