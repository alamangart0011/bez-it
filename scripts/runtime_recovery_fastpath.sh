#!/usr/bin/env bash
set -Eeuo pipefail

./deploy/runtime_parity.sh
./deploy/recovery_orchestrator.sh runtime
./deploy/status_report.sh
