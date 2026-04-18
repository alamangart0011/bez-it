#!/usr/bin/env bash
# Smoke-проверка production (HTTPS, dual-IP) bez-it.ru — с ретраями от сетевых флуктуаций
set -uo pipefail
cd "$(dirname "$0")"

TOKEN="$(grep -E '^BEZIT_CABINET_TOKEN=' .env 2>/dev/null | cut -d= -f2)"
TOKEN="${TOKEN:-devtoken_change_me}"

PASS=0; FAIL=0
# ck <name> <cmd...> — 3 попытки с паузой 2 сек
ck(){
  local name="$1"; shift
  local attempt
  for attempt in 1 2 3; do
    if "$@" >/dev/null 2>&1; then echo "  ✓ $name"; PASS=$((PASS+1)); return; fi
    sleep 2
  done
  echo "  ✗ $name"; FAIL=$((FAIL+1))
}

echo "=== bez-it.ru production smoke-тест (retry=3) ==="

echo
echo "[1] HTTP → HTTPS редиректы"
ck "GET http://bez-it.ru/ → 301"         curl -fsI --max-time 10 -o /dev/null "http://bez-it.ru/"
ck "GET http://kabinet.bez-it.ru/ → 301" curl -fsI --max-time 10 -o /dev/null "http://kabinet.bez-it.ru/"

echo
echo "[2] HTTPS — главный сайт"
ck "GET https://bez-it.ru/"                       curl -fs --max-time 10 "https://bez-it.ru/"
ck "GET https://www.bez-it.ru/ → 301"             curl -fsI --max-time 10 -o /dev/null "https://www.bez-it.ru/"
ck "GET https://bez-it.ru/robots.txt"             curl -fs --max-time 10 "https://bez-it.ru/robots.txt"
ck "GET https://bez-it.ru/sitemap.xml"            curl -fs --max-time 10 "https://bez-it.ru/sitemap.xml"
ck "GET https://bez-it.ru/turbo.xml"              curl -fs --max-time 10 "https://bez-it.ru/turbo.xml"
ck "GET https://bez-it.ru/yandex_9e7d671381785e61.html (verification)" \
    bash -c "curl -fs --max-time 10 'https://bez-it.ru/yandex_9e7d671381785e61.html' | grep -q '9e7d671381785e61'"
ck "GET /kii-2026.html"                           curl -fs --max-time 10 "https://bez-it.ru/kii-2026.html"
ck "GET /regions/moscow.html"                     curl -fs --max-time 10 "https://bez-it.ru/regions/moscow.html"
ck "GET /regions/"                                curl -fs --max-time 10 "https://bez-it.ru/regions/"
ck "GET /blog/"                                   curl -fs --max-time 10 "https://bez-it.ru/blog/"
ck "GET /partners.html"                           curl -fs --max-time 10 "https://bez-it.ru/partners.html"
ck "GET /resources/"                              curl -fs --max-time 10 "https://bez-it.ru/resources/"

echo
echo "[3] HTTPS — кабинет (выделенный IP)"
ck "GET https://kabinet.bez-it.ru/"      curl -fs --max-time 10 "https://kabinet.bez-it.ru/"

echo
echo "[4] API — через оба домена"
ck "POST /api/bez-it/leads (валидная)"   curl -fs --max-time 15 -X POST "https://bez-it.ru/api/bez-it/leads" \
    -H 'content-type: application/json' \
    -d '{"contactName":"Prod Smoke","phone":"+79991234567","comment":"prod-smoke","serviceKey":"kii","source":"prod-smoke","website":""}'
ck "GET cabinet leads (с токеном)"       curl -fs --max-time 10 -H "x-cabinet-token: ${TOKEN}" "https://kabinet.bez-it.ru/api/bez-it/cabinet/leads"

echo
echo "[5] Заголовки безопасности"
ck "HSTS on bez-it.ru"               bash -c "curl -fsI --max-time 10 https://bez-it.ru/ | grep -qi 'strict-transport-security'"
ck "X-Frame-Options DENY на kabinet" bash -c "curl -fsI --max-time 10 https://kabinet.bez-it.ru/ | grep -qi 'x-frame-options: DENY'"
ck "X-Robots noindex на kabinet"     bash -c "curl -fsI --max-time 10 https://kabinet.bez-it.ru/ | grep -qi 'x-robots-tag: noindex'"
ck "X-Content-Type-Options nosniff"  bash -c "curl -fsI --max-time 10 https://bez-it.ru/ | grep -qi 'x-content-type-options: nosniff'"

echo
echo "[6] SEO контракт (yandex-verification, метрика, canonical)"
ck "yandex-verification 9e7d671381785e61 на главной" \
    bash -c "curl -fs --max-time 10 https://bez-it.ru/ | grep -q 'content=\"9e7d671381785e61\"'"
ck "Метрика 108625027 на главной" \
    bash -c "curl -fs --max-time 10 https://bez-it.ru/ | grep -q 'mc.yandex.ru/metrika/tag.js?id=108625027'"
ck "canonical на главной" \
    bash -c "curl -fs --max-time 10 https://bez-it.ru/ | grep -qE 'rel=\"canonical\".*bez-it.ru'"
ck "JSON-LD AggregateRating на /regions/moscow.html" \
    bash -c "curl -fs --max-time 10 https://bez-it.ru/regions/moscow.html | grep -q 'AggregateRating'"

echo
echo "=== Итого: passed=${PASS}, failed=${FAIL} ==="
[[ ${FAIL} -eq 0 ]] || exit 1
