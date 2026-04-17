#!/usr/bin/env bash
# bez-it.ru — финальный деплой всего стека одной командой.
# Идемпотентно: можно запускать повторно.
#   ssh bez-it 'bash /opt/bez-it/deploy/jino-finalize.sh'
# или (если скрипт ещё не на сервере):
#   ssh bez-it 'cd /opt/bez-it && git pull && bash deploy/jino-finalize.sh'
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/bez-it}"
LOG="${APP_DIR}/.uptime/finalize.log"
mkdir -p "$(dirname "${LOG}")"

BLUE() { echo -e "\n\033[1;34m━━━ $* ━━━\033[0m"; }
OK()   { echo -e "\033[1;32m  ✓ $*\033[0m"; }
BAD()  { echo -e "\033[1;31m  ✗ $*\033[0m"; }
WARN() { echo -e "\033[1;33m  ⚠ $*\033[0m"; }

BLUE "0/10 pre-flight: root, pwd, git"
if [[ $EUID -ne 0 ]]; then BAD "нужен root"; exit 1; fi
cd "${APP_DIR}"
git fetch origin --quiet
git reset --hard origin/claude/landing-pages-leads-X4MIG --quiet
OK "на коммите: $(git log -1 --oneline)"

BLUE "1/10 DNS: отключаю systemd-resolved, фиксирую 8.8.8.8+Yandex+Cloudflare"
systemctl disable --now systemd-resolved 2>/dev/null || true
chattr -i /etc/resolv.conf 2>/dev/null || true
rm -f /etc/resolv.conf
cat > /etc/resolv.conf <<EOF
nameserver 8.8.8.8
nameserver 1.1.1.1
nameserver 77.88.8.8
options timeout:2 attempts:2
EOF
chattr +i /etc/resolv.conf 2>/dev/null || true
for d in bez-it.ru www.bez-it.ru kabinet.bez-it.ru; do
  ip=$(getent hosts "$d" | awk '{print $1}' | head -1)
  [[ -n "$ip" ]] && OK "$d → $ip" || BAD "$d не резолвится"
done

BLUE "2/10 docker stack — single-host режим"
cd "${APP_DIR}/ops/bez-it-sandbox"
docker compose -f docker-compose.single.yml --env-file .env up -d --remove-orphans
sleep 5
docker ps --format '  {{.Names}}: {{.Status}}' | grep bez-it || WARN "контейнеры не найдены"

BLUE "3/10 TLS-сертификат (проверка что покрывает 3 домена)"
if [[ -f /etc/letsencrypt/live/bez-it.ru/fullchain.pem ]]; then
  SANS=$(openssl x509 -in /etc/letsencrypt/live/bez-it.ru/fullchain.pem -noout -ext subjectAltName 2>/dev/null | tr ',' '\n' | grep -oP 'DNS:\K[^ ,]+' | tr '\n' ' ')
  OK "SAN: $SANS"
  for d in bez-it.ru www.bez-it.ru kabinet.bez-it.ru; do
    echo "$SANS" | grep -qw "$d" && OK "  $d в cert" || WARN "  $d отсутствует в cert — запустите deploy/jino-tls-single.sh"
  done
else
  BAD "cert отсутствует. Запустите: BEZIT_TLS_AUTO=1 bash ${APP_DIR}/deploy/jino-tls-single.sh admin@bez-it.ru"
fi

BLUE "4/10 установка cron для backup и uptime"
bash "${APP_DIR}/deploy/jino-backup.sh" --install
bash "${APP_DIR}/deploy/jino-uptime.sh" --install
systemctl restart cron 2>/dev/null || service cron restart 2>/dev/null || true
OK "cron.d установлены"

BLUE "5/10 первичный бэкап БД"
bash "${APP_DIR}/deploy/jino-backup.sh" 2>&1 | tail -5

BLUE "6/10 первичный прогон uptime-монитора"
bash "${APP_DIR}/deploy/jino-uptime.sh" 2>&1 | tail -10

BLUE "7/10 smoke-тест 20 гео-лендингов"
PASS=0; FAIL=0
for city in moscow spb ekaterinburg kazan novosibirsk krasnodar rostov nizhny-novgorod samara ufa perm voronezh volgograd chelyabinsk krasnoyarsk saratov tyumen izhevsk barnaul kaliningrad; do
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "https://bez-it.ru/regions/${city}.html" 2>/dev/null || echo 000)
  if [[ "$code" == "200" ]]; then
    OK "regions/${city}.html → 200"; PASS=$((PASS+1))
  else
    BAD "regions/${city}.html → $code"; FAIL=$((FAIL+1))
  fi
done
echo "  regions: passed=$PASS failed=$FAIL"

BLUE "8/10 Метрика 108625027 присутствует в ключевых страницах"
for u in "/" "/kii-2026.html" "/regions/moscow.html" "/regions/kazan.html" "/blog/"; do
  n=$(curl -fsS "https://bez-it.ru${u}" 2>/dev/null | grep -c "108625027" || echo 0)
  [[ "$n" -ge 1 ]] && OK "${u}: ${n} вхождений" || BAD "${u}: Метрика НЕ найдена"
done

BLUE "9/10 IndexNow + sitemap pings"
if curl -fsI "https://bez-it.ru/a3b6f03767b256851c6dc46315dff3e39eb4dd399c4251ba67c06b0d9c940cbd.txt" >/dev/null 2>&1; then
  OK "IndexNow key доступен"
  bash "${APP_DIR}/deploy/jino-indexnow-ping.sh" 2>&1 | tail -8
else
  BAD "IndexNow key недоступен"
fi

BLUE "10/10 итоговый smoke-prod"
cd "${APP_DIR}/ops/bez-it-sandbox"
./smoke-prod.sh

echo
BLUE "✅ FINALIZE DONE"
echo "  коммит:    $(git -C ${APP_DIR} log -1 --oneline)"
echo "  backups:   ls ${APP_DIR}/backups"
echo "  uptime:    tail ${APP_DIR}/.uptime/uptime.log"
echo "  логи nginx: docker logs bez-it-web --tail 50"
