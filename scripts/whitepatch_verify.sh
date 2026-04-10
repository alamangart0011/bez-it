#!/usr/bin/env bash
set -Eeuo pipefail

./deploy/runtime_parity.sh
./deploy/post_deploy_check.sh
./deploy/status_report.sh
