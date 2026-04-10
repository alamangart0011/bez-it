#!/usr/bin/env bash
set -Eeuo pipefail

./deploy/recovery_orchestrator.sh full
./deploy/status_report.sh
