#!/usr/bin/env bash
set -Eeuo pipefail

./scripts/apply_whitepatch_complete.sh
./scripts/backend_full_cycle.sh
./scripts/whitepatch_status.sh
