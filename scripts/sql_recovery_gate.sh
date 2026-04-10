#!/usr/bin/env bash
set -Eeuo pipefail

./deploy/runtime_parity.sh
./deploy/apply_sql.sh
./deploy/runtime_parity.sh
./deploy/post_deploy_check.sh
