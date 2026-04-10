#!/usr/bin/env bash
set -Eeuo pipefail

./scripts/preflight_verify.sh
./scripts/sql_recovery_gate.sh
./scripts/status_audit_fastpath.sh
