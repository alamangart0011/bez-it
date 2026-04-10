#!/usr/bin/env bash
set -Eeuo pipefail
./deploy/preflight.sh
./deploy/verify.sh
./deploy/status_report.sh
