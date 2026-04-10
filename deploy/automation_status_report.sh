#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

status_file() {
  local path="$1"
  if [ -f "$path" ]; then
    echo "OK|$path"
  else
    echo "MISS|$path"
  fi
}

echo "component|path"
status_file deploy/BASELINE.lock
status_file deploy/doctor.sh
status_file deploy/apply_sql.sh
status_file deploy/runtime_parity_apply_and_check.sh
status_file deploy/release_parity_and_smoke.sh
status_file deploy/post_deploy_check.sh
status_file deploy/automation_preflight.sh
status_file deploy/verify_automation_toolchain.sh
status_file deploy/module_probe_with_token.sh
status_file deploy/recovery_orchestrator.sh
status_file deploy/build_runtime_audit_bundle.sh
status_file deploy/generate_runtime_audit_bundle.sh
status_file deploy/run_recovery_and_bundle.sh
status_file scripts/smoke_api.sh
status_file scripts/sql_parity_report.sh
status_file docs/AUTOMATION_TOOLCHAIN_INDEX_RU.md
status_file docs/ONE_COMMAND_AUTOMATION_RUNBOOK_RU.md
status_file docs/AUTOMATION_PREFLIGHT_AND_VERIFY_RU.md

echo "[OK] automation status report completed"
