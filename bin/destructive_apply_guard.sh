#!/usr/bin/env bash
set -euo pipefail
[ "${1:-}" = "I_CONFIRM_DESTRUCTIVE" ] || { echo "REFUSED: pass exact token I_CONFIRM_DESTRUCTIVE" >&2; exit 1; }
shift
exec "$@"
