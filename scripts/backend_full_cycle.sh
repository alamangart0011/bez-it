#!/usr/bin/env bash
set -Eeuo pipefail

./scripts/preflight_verify.sh
./scripts/sql_recovery_gate.sh
./scripts/module_fastpath.sh
./scripts/status_audit_fastpath.sh
./scripts/runtime_recovery_fastpath.sh
./scripts/ops_fastpath.sh
