#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

for f in \
  infra/sql/014_backend_whitepatch_runtime_parity.sql \
  infra/sql/015_backend_whitepatch_runtime_seed.sql \
  infra/sql/016_backend_whitepatch_canonical_rooms.sql \
  infra/sql/017_backend_whitepatch_audit_consistency.sql \
  infra/sql/018_backend_whitepatch_contract_guards.sql
 do
  docker compose exec -T db sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < "$f"
done

./scripts/whitepatch_verify.sh
