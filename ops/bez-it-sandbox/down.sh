#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
docker compose -f docker-compose.bez-it.yml --env-file .env down
echo "[ok] стек остановлен. Данные БД сохранены в томе bez_it_pgdata."
echo "    чтобы удалить и БД: docker compose -f docker-compose.bez-it.yml down -v"
