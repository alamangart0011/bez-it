#!/usr/bin/env bash
# bez-it.ru — выпуск Let's Encrypt (SAN) и переключение в TLS-режим с двумя IP:
#   bez-it.ru, www.bez-it.ru     →  ${BEZIT_LANDING_IP:-109.73.192.126}
#   kabinet.bez-it.ru            →  ${BEZIT_CABINET_IP:-217.149.30.147}
#
# Требуется:
#   1. Выделенный IP привязан на VPS (bash deploy/jino-add-secondary-ip.sh)
#   2. DNS A-записи подняты на нужные IP
#
# Запуск:
#   sudo bash deploy/jino-tls.sh admin@bez-it.ru
set -euo pipefail

EMAIL="${1:-${LETSENCRYPT_EMAIL:-}}"
APP_DIR="${APP_DIR:-/opt/bez-it}"
DOMAIN_MAIN="bez-it.ru"
DOMAIN_WWW="www.bez-it.ru"
DOMAIN_CABINET="kabinet.bez-it.ru"

log()  { echo -e "\n[$(date +%H:%M:%S)] \033[1;32m$*\033[0m"; }
err()  { echo -e "\n[$(date +%H:%M:%S)] \033[1;31m$*\033[0m" >&2; }
warn() { echo -e "\n[$(date +%H:%M:%S)] \033[1;33m$*\033[0m"; }

if [[ $EUID -ne 0 ]]; then err "запустите от root: sudo bash $0 email@example.com"; exit 1; fi
if [[ -z "${EMAIL}" ]]; then err "Укажите email: bash $0 admin@bez-it.ru"; exit 1; fi
if [[ ! -d "${APP_DIR}/ops/bez-it-sandbox" ]]; then err "Не вижу ${APP_DIR} — сначала запустите jino-bootstrap.sh"; exit 1; fi

cd "${APP_DIR}/ops/bez-it-sandbox"

LANDING_IP="$(grep -E '^BEZIT_LANDING_IP=' .env 2>/dev/null | cut -d= -f2)"
CABINET_IP="$(grep -E '^BEZIT_CABINET_IP=' .env 2>/dev/null | cut -d= -f2)"
LANDING_IP="${LANDING_IP:-109.73.192.126}"
CABINET_IP="${CABINET_IP:-217.149.30.147}"

log "1/6 · ставлю certbot"
apt-get update -y
apt-get install -y certbot

log "2/6 · проверяю DNS"
echo "  ожидаемые IP:  landing=${LANDING_IP}  cabinet=${CABINET_IP}"
AUTO="${BEZIT_TLS_AUTO:-0}"
SKIP_WWW=0; SKIP_CABINET=0
check_dns() {
  local d="$1" want="$2" got
  got="$(getent hosts "${d}" | awk '{print $1}' | head -1)"
  if [[ "${got}" == "${want}" ]]; then
    echo "  ✓ ${d} → ${got}"
    return 0
  fi
  warn "  ✗ ${d} → ${got:-не резолвится} (ожидался ${want})"
  if [[ "${AUTO}" == "1" ]]; then
    echo "  [auto] исключаю ${d} из сертификата"
    return 1
  fi
  read -rp "  Продолжить, исключив ${d} из сертификата? [y/N] " ANS
  [[ "${ANS}" =~ ^[YyДд]$ ]] || return 2
  return 1
}
if ! check_dns "${DOMAIN_MAIN}" "${LANDING_IP}"; then
  r=$?; [[ $r -eq 2 ]] && exit 1
  err "главный домен ${DOMAIN_MAIN} обязателен"; exit 1
fi
check_dns "${DOMAIN_WWW}"  "${LANDING_IP}" || { r=$?; [[ $r -eq 2 ]] && exit 1; SKIP_WWW=1; }
check_dns "${DOMAIN_CABINET}" "${CABINET_IP}" || { r=$?; [[ $r -eq 2 ]] && exit 1; SKIP_CABINET=1; }

log "3/6 · проверяю что выделенный IP привязан к VPS"
echo "  адреса на VPS:"
ip -4 addr show scope global | awk '/inet /{print "    " $2}'
if ! ip -4 addr show scope global | grep -qw "${CABINET_IP}"; then
  err "IP ${CABINET_IP} не назначен на интерфейс. Запустите: bash ${APP_DIR}/deploy/jino-add-secondary-ip.sh"
  exit 1
fi

log "4/6 · гашу любые web-контейнеры (освобождаю порт 80)"
docker compose -f docker-compose.prod.yml --env-file .env stop bez-it-web bez-it-cabinet-web 2>/dev/null || true
docker compose -f docker-compose.bez-it.yml --env-file .env stop bez-it-web 2>/dev/null || true
sleep 2

log "5/6 · выпускаю SAN-сертификат Let's Encrypt"
DOMS_ARGS=("-d" "${DOMAIN_MAIN}")
[[ $SKIP_WWW -eq 0 ]]     && DOMS_ARGS+=("-d" "${DOMAIN_WWW}")
[[ $SKIP_CABINET -eq 0 ]] && DOMS_ARGS+=("-d" "${DOMAIN_CABINET}")

certbot certonly --standalone --non-interactive --agree-tos \
  --email "${EMAIL}" \
  --expand \
  "${DOMS_ARGS[@]}"

mkdir -p /var/www/certbot

log "6/6 · поднимаю production-стек (два nginx на двух IP)"
# Гасим sandbox-режим, чтобы освободить 8088 и чистенько подняться на prod-compose
docker compose -f docker-compose.bez-it.yml --env-file .env down 2>/dev/null || true
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Хук автообновления — reload обоих nginx после renew
RENEW_HOOK=/etc/letsencrypt/renewal-hooks/deploy/bez-it-reload.sh
mkdir -p "$(dirname "${RENEW_HOOK}")"
cat > "${RENEW_HOOK}" <<EOF
#!/bin/sh
docker compose -f ${APP_DIR}/ops/bez-it-sandbox/docker-compose.prod.yml \\
               --env-file ${APP_DIR}/ops/bez-it-sandbox/.env \\
               restart bez-it-web bez-it-cabinet-web
EOF
chmod +x "${RENEW_HOOK}"

systemctl enable --now certbot.timer 2>/dev/null || true

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ HTTPS включён (dual-IP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  https://bez-it.ru/           → ${LANDING_IP}
  https://www.bez-it.ru/       → ${LANDING_IP}
  https://kabinet.bez-it.ru/   → ${CABINET_IP}

  Сертификат:     /etc/letsencrypt/live/bez-it.ru/
  Автообновление: certbot.timer + reload hook (без даунтайма)
  Проверка:       curl -I https://bez-it.ru/
                  curl -I https://kabinet.bez-it.ru/
  Логи:           docker compose -f ${APP_DIR}/ops/bez-it-sandbox/docker-compose.prod.yml logs -f
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
