#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
TOKEN="${TOKEN:-}"

cd "$APP_DIR"

require_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "[ERR] missing file: $path"
    exit 1
  fi
  echo "[OK] file: $path"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERR] missing command: $cmd"
    exit 1
  fi
  echo "[OK] command: $cmd"
}

echo "[1/6] commands"
require_cmd docker
require_cmd curl
require_cmd tar

echo "[2/6] baseline files"
require_file deploy/BASELINE.lock
require_file deploy/doctor.sh
require_file deploy/apply_sql.sh
require_file deploy/runtime_parity_apply_and_check.sh
require_file deploy/post_deploy_check.sh
require_file scripts/smoke_api.sh
require_file scripts/sql_parity_report.sh
require_file deploy/module_probe_with_token.sh
require_file deploy/recovery_orchestrator.sh
require_file deploy/build_runtime_audit_bundle.sh
require_file deploy/generate_runtime_audit_bundle.sh
require_file deploy/run_recovery_and_bundle.sh

echo "[3/6] compose state"
docker compose ps >/dev/null

echo "[4/6] base runtime"
curl -fsS "$BASE_URL/api/health" >/dev/null
curl -fsS "$BASE_URL/api/release" >/dev/null

echo "[5/6] token mode"
if [ -n "$TOKEN" ]; then
  echo "[OK] TOKEN provided"
else
  echo "[WARN] TOKEN not provided; protected module probe will require it"
fi

echo "[6/6] baseline lock"
cat deploy/BASELINE.lock

echo "[OK] automation preflight completed"
