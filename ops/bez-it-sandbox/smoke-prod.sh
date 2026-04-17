#!/usr/bin/env bash
# Smoke-проверка production (HTTPS, dual-IP) bez-it.ru
set -euo pipefail
cd "$(dirname "$0")"

TOKEN="$(grep -E '^BEZIT_CABINET_TOKEN=' .env 2>/dev/null | cut -d= -f2)"
TOKEN="${TOKEN:-devtoken_change_me}"

PASS=0; FAIL=0
ck(){ local name="$1"; shift; if "$@" >/dev/null 2>&1; then echo "  ✓ $name"; PASS=$((PASS+1)); else echo "  ✗ $name"; FAIL=$((FAIL+1)); fi; }

echo "=== bez-it.ru production smoke-тест ==="

echo
echo "[1] HTTP → HTTPS редиректы"
ck "GET http://bez-it.ru/ → 301"         curl -fsI -o /dev/null "http://bez-it.ru/"
ck "GET http://kabinet.bez-it.ru/ → 301" curl -fsI -o /dev/null "http://kabinet.bez-it.ru/"

echo
echo "[2] HTTPS — главный сайт"
ck "GET https://bez-it.ru/"              curl -fs "https://bez-it.ru/"
ck "GET https://www.bez-it.ru/ → 301"    curl -fsI -o /dev/null "https://www.bez-it.ru/"
ck "GET https://bez-it.ru/robots.txt"    curl -fs "https://bez-it.ru/robots.txt"
ck "GET https://bez-it.ru/sitemap.xml"   curl -fs "https://bez-it.ru/sitemap.xml"
ck "GET /kii-2026.html"                  curl -fs "https://bez-it.ru/kii-2026.html"
ck "GET /regions/moscow.html"            curl -fs "https://bez-it.ru/regions/moscow.html"
ck "GET /blog/"                          curl -fs "https://bez-it.ru/blog/"

echo
echo "[3] HTTPS — кабинет (выделенный IP)"
ck "GET https://kabinet.bez-it.ru/"      curl -fs "https://kabinet.bez-it.ru/"

echo
echo "[4] API — через оба домена"
ck "POST /api/bez-it/leads (валидная)"   curl -fs -X POST "https://bez-it.ru/api/bez-it/leads" \
    -H 'content-type: application/json' \
    -d '{"contactName":"Prod Smoke","phone":"+79991234567","comment":"prod-smoke","serviceKey":"kii","source":"prod-smoke","website":""}'
ck "GET cabinet leads (с токеном)"       curl -fs -H "x-cabinet-token: ${TOKEN}" "https://kabinet.bez-it.ru/api/bez-it/cabinet/leads"

echo
echo "[5] Заголовки безопасности"
ck "HSTS on bez-it.ru"        bash -c "curl -fsI https://bez-it.ru/ | grep -qi 'strict-transport-security'"
ck "X-Frame-Options DENY на kabinet" bash -c "curl -fsI https://kabinet.bez-it.ru/ | grep -qi 'x-frame-options: DENY'"
ck "X-Robots noindex на kabinet"     bash -c "curl -fsI https://kabinet.bez-it.ru/ | grep -qi 'x-robots-tag: noindex'"

echo
echo "=== Итого: passed=${PASS}, failed=${FAIL} ==="
[[ ${FAIL} -eq 0 ]] || exit 1
