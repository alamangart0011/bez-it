#!/usr/bin/env bash
set -Eeuo pipefail

./scripts/apply_whitepatch_full.sh
./scripts/backend_full_cycle.sh
