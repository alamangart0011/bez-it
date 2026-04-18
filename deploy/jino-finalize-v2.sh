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

# retry_curl <url> — 3 попытки, возвращает код ответа или 000
retry_curl() {
  local url="$1"; local want="${2:-200}"; local code
  for _ in 1 2 3; do
    code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo 000)
    [[ "$code" == "$want" ]] && { echo "$code"; return 0; }
    sleep 2
  done
  echo "$code"
}

# retry_body <url> — 3 попытки, тело ответа
retry_body() {
  local url="$1"
  for _ in 1 2 3; do
    local body
    body=$(curl -fsS --max-time 10 "$url" 2>/dev/null) && { echo "$body"; return 0; }
    sleep 2
  done
  return 1
}

BLUE "0/13 pre-flight"
if [[ $EUID -ne 0 ]]; then BAD "нужен root"; exit 1; fi
cd "${APP_DIR}"
git fetch origin --quiet
git reset --hard origin/claude/landing-pages-leads-X4MIG --quiet
OK "на коммите: $(git log -1 --oneline)"

BLUE "1/13 регенерация региональных лендингов"
python3 tools/seo-regen-regions.py

BLUE "2/13 docker rebuild + nginx restart"
cd "${APP_DIR}/ops/bez-it-sandbox"
docker compose -f docker-compose.single.yml --env-file .env up -d --remove-orphans
sleep 4
docker exec bez-it-web nginx -t 2>&1 | tail -3 && OK "nginx config валиден"
# Полный restart контейнера: иногда reload не подхватывает монтированный conf.
docker compose -f docker-compose.single.yml restart bez-it-web >/dev/null 2>&1 && OK "bez-it-web перезапущен"
sleep 3
# Показываем, что nginx в контейнере реально видит свежий конфиг:
if docker exec bez-it-web grep -q "try_files \$uri =404" /etc/nginx/conf.d/default.conf; then
  OK "nginx config содержит try_files =404"
else
  WARN "nginx config без try_files =404 — проверьте монтирование"
fi

BLUE "3/13 smoke 20 регионов (retry=3)"
PASS=0; FAIL=0
for city in moscow spb ekaterinburg kazan novosibirsk krasnodar rostov nizhny-novgorod samara ufa perm voronezh volgograd chelyabinsk krasnoyarsk saratov tyumen izhevsk barnaul kaliningrad; do
  code=$(retry_curl "https://bez-it.ru/regions/${city}.html" 200)
  if [[ "$code" == "200" ]]; then PASS=$((PASS+1)); else BAD "regions/${city}: $code"; FAIL=$((FAIL+1)); fi
done
[[ $FAIL -eq 0 ]] && OK "regions: $PASS/20" || WARN "regions: $PASS/20 (failed $FAIL)"

BLUE "4/13 проверка 404.html (несуществующий URL должен → 404)"
code=$(retry_curl "https://bez-it.ru/totally-missing-page-xyz.html" 404)
[[ "$code" == "404" ]] && OK "404 возвращает $code" || WARN "404 код: $code (ожидался 404)"

BLUE "5/13 проверка turbo.xml"
turbo_size=$(retry_body "https://bez-it.ru/turbo.xml" 2>/dev/null | wc -c)
[[ "$turbo_size" -gt 500 ]] && OK "turbo.xml: ${turbo_size} bytes" || BAD "turbo.xml: ${turbo_size} bytes"

BLUE "6/13 robots.txt с Clean-param"
if retry_body "https://bez-it.ru/robots.txt" | grep -q "Clean-param"; then
  OK "robots.txt содержит Clean-param"
else
  BAD "robots.txt без Clean-param"
fi

BLUE "7/13 JSON-LD AggregateRating на 3 регионах"
for city in moscow spb kazan; do
  n=$(retry_body "https://bez-it.ru/regions/${city}.html" | grep -c "AggregateRating" || echo 0)
  [[ "$n" -ge 1 ]] && OK "regions/${city}: $n × AggregateRating" || BAD "regions/${city}: нет AggregateRating"
done

BLUE "8/13 Метрика reachGoal + counter ID 108625027"
for u in "/" "/regions/moscow.html" "/regions/kazan.html" "/partners.html" "/resources/"; do
  body=$(retry_body "https://bez-it.ru${u}") || { BAD "${u}: не ответил"; continue; }
  n_goal=$(echo "$body" | grep -c "reachGoal" || echo 0)
  has_id=$(echo "$body" | grep -q 'id=108625027' && echo yes || echo no)
  if [[ "$n_goal" -ge 1 && "$has_id" == yes ]]; then
    OK "${u}: ${n_goal} × reachGoal + counter"
  else
    WARN "${u}: reachGoal=$n_goal counter=$has_id"
  fi
done

BLUE "9/13 Yandex verification: файл + meta"
# pipefail + -fsS в пайпе ломались на флейках TLS. Сохраняем тело в переменную,
# затем grep отдельно — как делает smoke-prod (он проходит стабильно).
file_ok=0; meta_ok=0
for attempt in 1 2 3; do
  body=$(curl -sS --max-time 10 "https://bez-it.ru/yandex_9e7d671381785e61.html" 2>/dev/null || true)
  if [[ -n "$body" ]] && echo "$body" | grep -q "9e7d671381785e61"; then file_ok=1; break; fi
  sleep 2
done
for attempt in 1 2 3; do
  body=$(curl -sS --max-time 10 "https://bez-it.ru/" 2>/dev/null || true)
  if [[ -n "$body" ]] && echo "$body" | grep -q 'content="9e7d671381785e61"'; then meta_ok=1; break; fi
  sleep 2
done
[[ $file_ok -eq 1 ]] && OK "файл /yandex_9e7d671381785e61.html: 200 + содержит токен" \
                     || BAD "файл /yandex_...html не найден или без токена"
[[ $meta_ok -eq 1 ]] && OK "meta yandex-verification на главной" \
                     || BAD "meta yandex-verification НЕ на главной"

BLUE "10/13 IndexNow ping (45+ URL)"
bash "${APP_DIR}/deploy/jino-indexnow-ping.sh" 2>&1 | tail -5

BLUE "11/13 sitemap.xml: count <loc> и HTTP-коды первых 10 URL"
body=$(retry_body "https://bez-it.ru/sitemap.xml")
n=$(echo "$body" | grep -c "<loc>" || echo 0)
OK "sitemap: $n URL"
# проверим первые 10 URL (кроме hash-якорей и /#)
echo "$body" | grep -oE "https://bez-it\.ru[^<#]+" | sort -u | head -10 | while read -r u; do
  c=$(retry_curl "$u" 200)
  [[ "$c" == "200" ]] && echo -e "\033[1;32m    ✓ $u → $c\033[0m" || echo -e "\033[1;31m    ✗ $u → $c\033[0m"
done

BLUE "12/13 smoke-prod финальный (retry=3)"
cd "${APP_DIR}/ops/bez-it-sandbox"
./smoke-prod.sh

echo
BLUE "✅ FINALIZE-V2 DONE"
echo "  commit:    $(git -C ${APP_DIR} log -1 --oneline)"
echo "  regions:   $PASS/20 passed"
echo "  sitemap:   $n URLs"
echo "  turbo:     $turbo_size bytes"
