#!/usr/bin/env bash
set -Eeuo pipefail

./deploy/module_verify.sh
./deploy/verify.sh
./deploy/status_report.sh
