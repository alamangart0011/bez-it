#!/usr/bin/env bash
# bez-it.ru — finalize v2: rich regions, 404, turbo, error_page, metrika goals.
# Запуск:  ssh bez-it 'cd /opt/bez-it && git pull && bash deploy/jino-finalize-v2.sh'
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/bez-it}"
LOG="${APP_DIR}/.uptime/finalize-v2.log"
mkdir -p "$(dirname "${LOG}")"

BLUE() { echo -e "\n\033[1;34m━━━ $* ━━━\033[0m"; }
OK()   { echo -e "\033[1;32m  ✓ $*\033[0m"; }
BAD()  { echo -e "\033[1;31m  ✗ $*\033[0m"; }
WARN() { echo -e "\033[1;33m  ⚠ $*\033[0m"; }

BLUE "0/12 pre-flight"
if [[ $EUID -ne 0 ]]; then BAD "нужен root"; exit 1; fi
cd "${APP_DIR}"
git fetch origin --quiet
git reset --hard origin/claude/landing-pages-leads-X4MIG --quiet
OK "на коммите: $(git log -1 --oneline)"

BLUE "1/12 регенерация региональных лендингов"
python3 tools/seo-regen-regions.py

BLUE "2/12 docker rebuild"
cd "${APP_DIR}/ops/bez-it-sandbox"
docker compose -f docker-compose.single.yml --env-file .env up -d --remove-orphans
sleep 4
docker exec bez-it-web nginx -t 2>&1 | tail -3 && OK "nginx config валиден"
docker exec bez-it-web nginx -s reload && OK "nginx перезагружен"

BLUE "3/12 smoke 20 регионов"
PASS=0; FAIL=0
for city in moscow spb ekaterinburg kazan novosibirsk krasnodar rostov nizhny-novgorod samara ufa perm voronezh volgograd chelyabinsk krasnoyarsk saratov tyumen izhevsk barnaul kaliningrad; do
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "https://bez-it.ru/regions/${city}.html" 2>/dev/null || echo 000)
  if [[ "$code" == "200" ]]; then PASS=$((PASS+1)); else BAD "regions/${city}: $code"; FAIL=$((FAIL+1)); fi
done
[[ $FAIL -eq 0 ]] && OK "regions: $PASS/20" || WARN "regions: $PASS/20 (failed $FAIL)"

BLUE "4/12 проверка 404.html"
code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "https://bez-it.ru/totally-missing-page-xyz.html" 2>/dev/null || echo 000)
[[ "$code" == "404" ]] && OK "404 возвращает $code" || WARN "404 код: $code (ожидался 404)"

BLUE "5/12 проверка turbo.xml"
turbo_size=$(curl -fsS "https://bez-it.ru/turbo.xml" 2>/dev/null | wc -c)
[[ "$turbo_size" -gt 500 ]] && OK "turbo.xml: ${turbo_size} bytes" || BAD "turbo.xml: ${turbo_size} bytes"

BLUE "6/12 проверка robots.txt с Clean-param"
if curl -fsS "https://bez-it.ru/robots.txt" 2>/dev/null | grep -q "Clean-param"; then
  OK "robots.txt содержит Clean-param"
else
  BAD "robots.txt без Clean-param"
fi

BLUE "7/12 JSON-LD AggregateRating на 3 регионах"
for city in moscow spb kazan; do
  n=$(curl -fsS "https://bez-it.ru/regions/${city}.html" 2>/dev/null | grep -c "AggregateRating" || echo 0)
  [[ "$n" -ge 1 ]] && OK "regions/${city}: $n × AggregateRating" || BAD "regions/${city}: нет AggregateRating"
done

BLUE "8/12 Метрика reachGoal на ключевых страницах"
for u in "/" "/regions/moscow.html" "/regions/kazan.html"; do
  n=$(curl -fsS "https://bez-it.ru${u}" 2>/dev/null | grep -c "reachGoal" || echo 0)
  [[ "$n" -ge 1 ]] && OK "${u}: ${n} × reachGoal" || WARN "${u}: нет reachGoal"
done

BLUE "9/12 IndexNow для новых URL"
bash "${APP_DIR}/deploy/jino-indexnow-ping.sh" 2>&1 | tail -5

BLUE "10/12 sitemap.xml свежий"
curl -fsS "https://bez-it.ru/sitemap.xml" 2>/dev/null | grep -c "<loc>" || echo 0

BLUE "11/12 Yandex Webmaster ping"
curl -fsS "https://webmaster.yandex.ru/ping?sitemap=https://bez-it.ru/sitemap.xml" 2>&1 | tail -3 || WARN "yandex ping fail"
curl -fsS "https://www.google.com/ping?sitemap=https://bez-it.ru/sitemap.xml" 2>&1 | tail -3 || WARN "google ping fail"

BLUE "12/12 smoke-prod финальный"
cd "${APP_DIR}/ops/bez-it-sandbox"
./smoke-prod.sh

echo
BLUE "✅ FINALIZE-V2 DONE"
echo "  commit:    $(git -C ${APP_DIR} log -1 --oneline)"
echo "  regions:   $PASS/20 passed"
echo "  404:       $code"
echo "  turbo:     $turbo_size bytes"
