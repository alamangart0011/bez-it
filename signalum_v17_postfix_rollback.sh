#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-/opt/messenger/contour-chat-jino-final}"
WORK="${1:-}"
if [ -z "$WORK" ]; then
  WORK="$(ls -1dt "$BASE"/deploy/fixpacks/* 2>/dev/null | head -n 1 || true)"
fi

if [ -z "$WORK" ] || [ ! -d "$WORK" ]; then
  echo "[ERR] fixpack backup dir not found"
  exit 1
fi

cd "$BASE"

echo "[1/4] restore files from $WORK"
[ -f "$WORK/apply_sql.sh.before" ] && cp -f "$WORK/apply_sql.sh.before" deploy/apply_sql.sh
[ -f "$WORK/013_legacy_schema_parity.sql.before" ] && cp -f "$WORK/013_legacy_schema_parity.sql.before" infra/sql/013_legacy_schema_parity.sql
[ -f "$WORK/014_runtime_alignment.sql.before" ] && cp -f "$WORK/014_runtime_alignment.sql.before" infra/sql/014_runtime_alignment.sql || rm -f infra/sql/014_runtime_alignment.sql
chmod +x deploy/apply_sql.sh || true

echo "[2/4] restore database"
if [ -f "$WORK/pre_fix_db.dump" ]; then
  docker compose exec -T db sh -lc 'dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
  docker compose exec -T db sh -lc 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < "$WORK/pre_fix_db.dump"
else
  echo "[WARN] no database dump found, skip DB restore"
fi

echo "[3/4] restart"
docker compose restart api web || true
sleep 8

echo "[4/4] health"
curl -fsS http://127.0.0.1:8080/api/health || true

echo "[OK] rollback complete"
