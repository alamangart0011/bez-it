#!/usr/bin/env bash
set -Eeuo pipefail

./scripts/sql_recovery_gate.sh
./scripts/module_fastpath.sh
./scripts/status_audit_fastpath.sh
