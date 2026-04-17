#!/usr/bin/env bash
# bez-it sandbox — поднять локально / на jino за 1 команду
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "[i] копирую .env.sandbox.example → .env"
  cp .env.sandbox.example .env
  echo "[!] открой .env и замени BEZIT_DB_PASSWORD и BEZIT_CABINET_TOKEN перед публикацией наружу"
fi

echo "[1/3] подтягиваю образы и собираю"
docker compose -f docker-compose.bez-it.yml --env-file .env pull --ignore-pull-failures || true
docker compose -f docker-compose.bez-it.yml --env-file .env build

echo "[2/3] запускаю стек"
docker compose -f docker-compose.bez-it.yml --env-file .env up -d

echo "[3/3] жду готовности БД…"
for i in {1..30}; do
  if docker compose -f docker-compose.bez-it.yml exec -T bez-it-db pg_isready -U "${BEZIT_DB_USER:-bezit}" >/dev/null 2>&1; then
    echo "[ok] БД готова"
    break
  fi
  sleep 2
done

PORT="$(grep -E '^BEZIT_HTTP_PORT=' .env | cut -d= -f2)"
PORT="${PORT:-8088}"
echo
echo "✓ Песочница поднята."
echo "  Лендинг:   http://localhost:${PORT}/"
echo "  Кабинет:   http://localhost:${PORT}/kabinet/"
echo "  API:       http://localhost:${PORT}/api/bez-it/"
echo
echo "Smoke-проверка: ./smoke.sh"
