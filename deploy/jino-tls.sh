#!/usr/bin/env bash
# bez-it.ru — выпуск Let's Encrypt и переключение nginx-контейнера в TLS-режим
# Запускать ПОСЛЕ jino-bootstrap.sh, когда DNS bez-it.ru → ваш IP уже резолвится.
#
# Использование:
#   bash deploy/jino-tls.sh you@example.com           # email для Let's Encrypt
#
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

log "1/5 · ставлю certbot"
apt-get update -y
apt-get install -y certbot

log "2/5 · проверяю, что DNS резолвится в этот сервер"
SELF_IP="$(curl -s4 ifconfig.me 2>/dev/null || echo unknown)"
echo "  IP сервера: ${SELF_IP}"
for d in "${DOMAIN_MAIN}" "${DOMAIN_WWW}" "${DOMAIN_CABINET}"; do
  RESOLVED="$(getent hosts "${d}" | awk '{print $1}' | head -1)"
  if [[ "${RESOLVED}" == "${SELF_IP}" ]]; then
    echo "  ✓ ${d} → ${RESOLVED}"
  else
    warn "  ✗ ${d} → ${RESOLVED:-не резолвится} (ожидался ${SELF_IP})"
    warn "    DNS ещё не подтянулся. Если NS-записи jino — обычно 5–60 минут. Прервитесь Ctrl+C и запустите позже."
    read -rp "  Продолжить, исключив этот домен из сертификата? [y/N] " ANS
    [[ "${ANS}" =~ ^[YyДд]$ ]] || exit 1
    if [[ "${d}" == "${DOMAIN_WWW}" ]]; then DOMAIN_WWW=""; fi
    if [[ "${d}" == "${DOMAIN_CABINET}" ]]; then DOMAIN_CABINET=""; fi
  fi
done

log "3/5 · временно останавливаю web-контейнер для standalone-режима certbot"
cd "${APP_DIR}/ops/bez-it-sandbox"
docker compose -f docker-compose.bez-it.yml stop bez-it-web || true

log "4/5 · выпускаю сертификат Let's Encrypt"
DOMS_ARGS=("-d" "${DOMAIN_MAIN}")
[[ -n "${DOMAIN_WWW}" ]] && DOMS_ARGS+=("-d" "${DOMAIN_WWW}")
[[ -n "${DOMAIN_CABINET}" ]] && DOMS_ARGS+=("-d" "${DOMAIN_CABINET}")

certbot certonly --standalone --non-interactive --agree-tos \
  --email "${EMAIL}" \
  "${DOMS_ARGS[@]}"

mkdir -p /var/www/certbot

log "5/5 · поднимаю web-контейнер в TLS-режиме"
docker compose -f docker-compose.bez-it.yml -f docker-compose.tls.yml --env-file .env up -d bez-it-web

# хук автообновления — после renew пере-стартуем nginx
RENEW_HOOK=/etc/letsencrypt/renewal-hooks/deploy/bez-it-reload.sh
mkdir -p "$(dirname "${RENEW_HOOK}")"
cat > "${RENEW_HOOK}" <<EOF
#!/bin/sh
docker compose -f ${APP_DIR}/ops/bez-it-sandbox/docker-compose.bez-it.yml \\
               -f ${APP_DIR}/ops/bez-it-sandbox/docker-compose.tls.yml \\
               --env-file ${APP_DIR}/ops/bez-it-sandbox/.env \\
               restart bez-it-web
EOF
chmod +x "${RENEW_HOOK}"

# certbot.timer уже включён по умолчанию в Ubuntu — проверим
systemctl enable --now certbot.timer 2>/dev/null || true

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ HTTPS включён для bez-it.ru
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  https://bez-it.ru/
  https://www.bez-it.ru/
  https://kabinet.bez-it.ru/

  Сертификат:    /etc/letsencrypt/live/bez-it.ru/
  Автообновление: certbot.timer + reload hook (без даунтайма)
  Проверка:      curl -I https://bez-it.ru/

  Пере-выпуск вручную:  certbot renew --force-renewal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
