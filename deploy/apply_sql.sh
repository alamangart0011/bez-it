#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

HAS_BASE="$(
  docker compose exec -T db sh -lc 'psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT CASE WHEN to_regclass('\''public.users'\'') IS NOT NULL AND to_regclass('\''public.rooms'\'') IS NOT NULL THEN 1 ELSE 0 END;"' \
  | tr -d '\r'
)"

for f in $(ls infra/sql/*.sql | sort); do
  base="$(basename "$f")"

  if [ "$HAS_BASE" = "1" ] && { [ "$base" = "001_init.sql" ] || [ "$base" = "002_seed.sql" ]; }; then
    echo "[SQL] skip $base on existing baseline"
    continue
  fi

  # Карантин: 013 ссылается на несуществующие колонки (users.organization_id и др.)
  if [ "$base" = "013_legacy_schema_parity.sql" ]; then
    echo "[SQL] QUARANTINE skip $base — incompatible with active schema"
    continue
  fi

  echo "[SQL] apply $base"
  docker compose exec -T db sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < "$f"
done
