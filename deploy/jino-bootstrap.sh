#!/usr/bin/env bash
# bez-it.ru — bootstrap для Jino VPS Ubuntu
# Запуск:  bash <(curl -fsSL https://raw.githubusercontent.com/alamangart0011/bez-it/claude/landing-pages-leads-X4MIG/deploy/jino-bootstrap.sh)
# или:    bash deploy/jino-bootstrap.sh
set -euo pipefail

REPO_OWNER="${REPO_OWNER:-alamangart0011}"
REPO_NAME="${REPO_NAME:-bez-it}"
BRANCH="${BRANCH:-claude/landing-pages-leads-X4MIG}"
APP_DIR="${APP_DIR:-/opt/bez-it}"
HTTP_PORT="${HTTP_PORT:-80}"

# Если репо приватный — задайте GH_TOKEN перед запуском:
#   GH_TOKEN=ghp_xxx bash deploy/jino-bootstrap.sh
if [[ -n "${GH_TOKEN:-}" ]]; then
  REPO_URL="https://${GH_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
else
  REPO_URL="${REPO_URL:-https://github.com/${REPO_OWNER}/${REPO_NAME}.git}"
fi

log() { echo -e "\n[$(date +%H:%M:%S)] \033[1;32m$*\033[0m"; }
err() { echo -e "\n[$(date +%H:%M:%S)] \033[1;31m$*\033[0m" >&2; }

if [[ $EUID -ne 0 ]]; then err "Запустите от root: sudo bash $0"; exit 1; fi

log "1/7 · обновляю apt и ставлю базовые пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release git ufw openssl

if ! command -v docker >/dev/null 2>&1; then
  log "2/7 · ставлю Docker Engine"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  log "2/7 · Docker уже установлен ($(docker --version))"
fi

log "3/7 · клонирую репозиторий в ${APP_DIR}"
if [[ -d "${APP_DIR}/.git" ]]; then
  cd "${APP_DIR}"
  git fetch --all --prune
  git checkout "${BRANCH}"
  git pull --ff-only origin "${BRANCH}"
else
  git clone --branch "${BRANCH}" --single-branch "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
fi

log "4/7 · готовлю .env"
cd "${APP_DIR}/ops/bez-it-sandbox"
if [[ ! -f .env ]]; then
  cp .env.sandbox.example .env
  DB_PASS="$(openssl rand -hex 16)"
  CAB_TOKEN="$(openssl rand -hex 24)"
  JWT_SEC="$(openssl rand -hex 32)"
  JWT_REF="$(openssl rand -hex 32)"
  sed -i "s|^BEZIT_DB_PASSWORD=.*|BEZIT_DB_PASSWORD=${DB_PASS}|" .env
  sed -i "s|^BEZIT_CABINET_TOKEN=.*|BEZIT_CABINET_TOKEN=${CAB_TOKEN}|" .env
  sed -i "s|^BEZIT_HTTP_PORT=.*|BEZIT_HTTP_PORT=${HTTP_PORT}|" .env
  sed -i "s|^BEZIT_JWT_SECRET=.*|BEZIT_JWT_SECRET=${JWT_SEC}|" .env
  sed -i "s|^BEZIT_JWT_REFRESH_SECRET=.*|BEZIT_JWT_REFRESH_SECRET=${JWT_REF}|" .env
  echo "  -> сгенерированы:"
  echo "     BEZIT_DB_PASSWORD=${DB_PASS}"
  echo "     BEZIT_CABINET_TOKEN=${CAB_TOKEN}"
  echo "     BEZIT_JWT_SECRET=${JWT_SEC:0:8}…"
  echo "  -> позже впишите в .env свои BEZIT_TG_BOT_TOKEN / *_CHAT, если нужен Telegram"
else
  echo "  -> .env уже существует, оставляю без изменений"
fi

log "5/7 · открываю фаервол для портов 80/443/22"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow ${HTTP_PORT}/tcp || true
  ufw allow 443/tcp || true
  yes | ufw enable || true
  ufw status || true
fi

log "6/7 · собираю и поднимаю docker-стек (это займёт 2–5 минут)"
docker compose -f docker-compose.bez-it.yml --env-file .env pull --ignore-pull-failures || true
docker compose -f docker-compose.bez-it.yml --env-file .env build
docker compose -f docker-compose.bez-it.yml --env-file .env up -d

log "ждём готовности БД и API..."
for i in $(seq 1 40); do
  if docker compose -f docker-compose.bez-it.yml exec -T bez-it-db pg_isready -U bezit >/dev/null 2>&1; then
    echo "  -> БД готова"
    break
  fi
  sleep 2
done
sleep 5

log "7/7 · smoke-тест"
chmod +x smoke.sh up.sh down.sh
./smoke.sh || err "smoke-тест прошёл с ошибками — смотрите логи: docker compose -f ${APP_DIR}/ops/bez-it-sandbox/docker-compose.bez-it.yml logs --tail 80"

IP="$(curl -s4 ifconfig.me 2>/dev/null || echo '<IP-сервера>')"
TOKEN_LINE="$(grep -E '^BEZIT_CABINET_TOKEN=' .env | cut -d= -f2)"

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ bez-it.ru развёрнут на Jino
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Лендинг   : http://${IP}/
  Кабинет   : http://${IP}/kabinet/
  API лидов : http://${IP}/api/bez-it/leads

  Токен кабинета (вход):
  ${TOKEN_LINE}

  Логи         : cd ${APP_DIR}/ops/bez-it-sandbox && docker compose logs -f
  Перезапуск   : cd ${APP_DIR}/ops/bez-it-sandbox && ./down.sh && ./up.sh
  Обновление   : cd ${APP_DIR} && git pull && cd ops/bez-it-sandbox && ./up.sh

  Дальше:
  1. ОБЯЗАТЕЛЬНО смените root-пароль:  passwd
  2. Привяжите домен bez-it.ru к ${IP} (DNS A-record)
  3. После того как DNS подтянется — поставим certbot для HTTPS
  4. Заполните в .env BEZIT_TG_BOT_TOKEN и перезапустите с профилем bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
