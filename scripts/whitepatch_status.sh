#!/usr/bin/env bash
set -Eeuo pipefail

./deploy/status_report.sh
./scripts/whitepatch_verify.sh
