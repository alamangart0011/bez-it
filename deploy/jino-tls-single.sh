#!/usr/bin/env bash
# bez-it.ru — single-host TLS (все 3 домена на основном IP 109.73.192.126).
# Выделенный IP не используется. Это временный режим — для перехода на
# dual-IP запустите deploy/jino-tls.sh после подтверждения Jino.
#
# Требуется DNS:
#   bez-it.ru          A  →  109.73.192.126
#   www.bez-it.ru      A  →  109.73.192.126
#   kabinet.bez-it.ru  A  →  109.73.192.126   (временно)
#
# Запуск:
#   sudo bash deploy/jino-tls-single.sh admin@bez-it.ru
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

LANDING_IP=""
if [[ -f .env ]]; then
  LANDING_IP="$(awk -F= '/^BEZIT_LANDING_IP=/{print $2; exit}' .env 2>/dev/null || true)"
fi
LANDING_IP="${LANDING_IP:-109.73.192.126}"

log "1/6 · ставлю certbot"
apt-get update -y
apt-get install -y certbot

log "2/6 · проверяю DNS (все 3 домена → ${LANDING_IP})"
AUTO="${BEZIT_TLS_AUTO:-0}"
SKIP_WWW=0; SKIP_CABINET=0
check_dns() {
  local d="$1" got
  got="$(getent hosts "${d}" | awk '{print $1}' | head -1)"
  if [[ -z "${got}" ]]; then
    got="$(dig +short @8.8.8.8 "${d}" 2>/dev/null | tail -1 || true)"
  fi
  if [[ "${got}" == "${LANDING_IP}" ]]; then
    echo "  ✓ ${d} → ${got}"
    return 0
  fi
  warn "  ✗ ${d} → ${got:-не резолвится} (ожидался ${LANDING_IP})"
  if [[ "${AUTO}" == "1" ]]; then
    echo "  [auto] исключаю ${d} из сертификата"
    return 1
  fi
  read -rp "  Продолжить, исключив ${d} из сертификата? [y/N] " ANS
  [[ "${ANS}" =~ ^[YyДд]$ ]] || return 2
  return 1
}
if ! check_dns "${DOMAIN_MAIN}"; then
  r=$?; [[ $r -eq 2 ]] && exit 1
  err "главный домен ${DOMAIN_MAIN} обязателен"; exit 1
fi
check_dns "${DOMAIN_WWW}"     || { r=$?; [[ $r -eq 2 ]] && exit 1; SKIP_WWW=1; }
check_dns "${DOMAIN_CABINET}" || { r=$?; [[ $r -eq 2 ]] && exit 1; SKIP_CABINET=1; }

if [[ $SKIP_CABINET -eq 1 ]]; then
  warn "kabinet.bez-it.ru не смотрит на ${LANDING_IP}. В Jino измените A-запись:"
  warn "  kabinet.bez-it.ru → ${LANDING_IP}  (временно, пока не переедем на 217.149.30.147)"
fi

log "3/6 · гашу любые web-контейнеры (освобождаю порт 80)"
docker compose -f docker-compose.single.yml --env-file .env stop bez-it-web 2>/dev/null || true
docker compose -f docker-compose.prod.yml   --env-file .env stop bez-it-web bez-it-cabinet-web 2>/dev/null || true
docker compose -f docker-compose.bez-it.yml --env-file .env stop bez-it-web 2>/dev/null || true
sleep 2

log "4/6 · выпускаю SAN-сертификат Let's Encrypt"
DOMS_ARGS=("-d" "${DOMAIN_MAIN}")
[[ $SKIP_WWW -eq 0 ]]     && DOMS_ARGS+=("-d" "${DOMAIN_WWW}")
[[ $SKIP_CABINET -eq 0 ]] && DOMS_ARGS+=("-d" "${DOMAIN_CABINET}")

# Если есть старый cert без нужных доменов — удаляем, чтобы --expand сработал
if [[ -d /etc/letsencrypt/live/bez-it.ru ]]; then
  EXISTING="$(openssl x509 -in /etc/letsencrypt/live/bez-it.ru/fullchain.pem -noout -text 2>/dev/null | awk -F, '/DNS:/{gsub(/DNS:/,""); print}' | tr -d ' ')"
  NEED="${DOMAIN_MAIN}"
  [[ $SKIP_WWW -eq 0 ]]     && NEED="${NEED},${DOMAIN_WWW}"
  [[ $SKIP_CABINET -eq 0 ]] && NEED="${NEED},${DOMAIN_CABINET}"
  if [[ "${EXISTING}" != *"${DOMAIN_CABINET}"* && $SKIP_CABINET -eq 0 ]]; then
    warn "текущий cert не содержит ${DOMAIN_CABINET} — удаляю для перевыпуска"
    certbot delete --cert-name bez-it.ru --non-interactive || true
  fi
fi

certbot certonly --standalone --non-interactive --agree-tos \
  --email "${EMAIL}" \
  --expand \
  "${DOMS_ARGS[@]}"

mkdir -p /var/www/certbot

log "5/6 · гашу старые prod/sandbox compose и поднимаю single"
docker compose -f docker-compose.prod.yml   --env-file .env down 2>/dev/null || true
docker compose -f docker-compose.bez-it.yml --env-file .env down 2>/dev/null || true
docker compose -f docker-compose.single.yml --env-file .env up -d

log "6/6 · хук автообновления — reload nginx после renew"
RENEW_HOOK=/etc/letsencrypt/renewal-hooks/deploy/bez-it-reload.sh
mkdir -p "$(dirname "${RENEW_HOOK}")"
cat > "${RENEW_HOOK}" <<EOF
#!/bin/sh
docker compose -f ${APP_DIR}/ops/bez-it-sandbox/docker-compose.single.yml \\
               --env-file ${APP_DIR}/ops/bez-it-sandbox/.env \\
               restart bez-it-web
EOF
chmod +x "${RENEW_HOOK}"

systemctl enable --now certbot.timer 2>/dev/null || true

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ HTTPS включён (single-host, все 3 домена на ${LANDING_IP})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  https://bez-it.ru/           → ${LANDING_IP}
  https://www.bez-it.ru/       → ${LANDING_IP}
  https://kabinet.bez-it.ru/   → ${LANDING_IP}

  Сертификат:     /etc/letsencrypt/live/bez-it.ru/
  Автообновление: certbot.timer + reload hook
  Проверка:       curl -I https://bez-it.ru/
                  curl -I https://kabinet.bez-it.ru/
  Логи:           docker compose -f ${APP_DIR}/ops/bez-it-sandbox/docker-compose.single.yml logs -f

  Позже, для переезда kabinet на выделенный IP 217.149.30.147:
    1. DNS: kabinet.bez-it.ru → 217.149.30.147
    2. bash ${APP_DIR}/deploy/jino-tls.sh admin@bez-it.ru
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
