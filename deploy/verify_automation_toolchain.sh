#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

FILES=(
  deploy/doctor.sh
  deploy/apply_sql.sh
  deploy/runtime_parity_apply_and_check.sh
  deploy/release_parity_and_smoke.sh
  deploy/post_deploy_check.sh
  deploy/module_probe_with_token.sh
  deploy/recovery_orchestrator.sh
  deploy/build_runtime_audit_bundle.sh
  deploy/generate_runtime_audit_bundle.sh
  deploy/run_recovery_and_bundle.sh
  scripts/smoke_api.sh
  scripts/sql_parity_report.sh
)

echo "[INFO] verifying automation toolchain"
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "[ERR] missing: $file"
    exit 1
  fi
  if ! bash -n "$file"; then
    echo "[ERR] shell syntax failed: $file"
    exit 1
  fi
  echo "[OK] $file"
done

echo "[OK] automation toolchain verified"
