#!/usr/bin/env bash
set -Eeuo pipefail

./deploy/status_report.sh
./deploy/audit_bundle.sh
