#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

for f in \
  infra/sql/014_backend_whitepatch_runtime_parity.sql \
  infra/sql/015_backend_whitepatch_runtime_seed.sql
 do
  docker compose exec -T db sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < "$f"
done

./deploy/runtime_parity.sh
./deploy/status_report.sh
