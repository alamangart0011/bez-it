#!/usr/bin/env bash
# Smoke-проверка песочницы bez-it.ru
set -euo pipefail
cd "$(dirname "$0")"

PORT="$(grep -E '^BEZIT_HTTP_PORT=' .env 2>/dev/null | cut -d= -f2)"
PORT="${PORT:-8088}"
TOKEN="$(grep -E '^BEZIT_CABINET_TOKEN=' .env 2>/dev/null | cut -d= -f2)"
TOKEN="${TOKEN:-devtoken_change_me}"

BASE="http://localhost:${PORT}"
PASS=0; FAIL=0
ck(){ local name="$1"; shift; if "$@" >/dev/null 2>&1; then echo "  ✓ $name"; ((PASS++)); else echo "  ✗ $name"; ((FAIL++)); fi; }

echo "=== Песочница bez-it.ru — smoke-тест на ${BASE} ==="

echo
echo "[1] статика лендинга"
ck "GET / → 200"            curl -fs "${BASE}/"
ck "GET /robots.txt → 200"  curl -fs "${BASE}/robots.txt"
ck "GET /sitemap.xml → 200" curl -fs "${BASE}/sitemap.xml"
ck "GET /kii-2026.html"     curl -fs "${BASE}/kii-2026.html"
ck "GET /ispdn-152fz.html"  curl -fs "${BASE}/ispdn-152fz.html"
ck "GET /gossopka-podklyuchenie.html" curl -fs "${BASE}/gossopka-podklyuchenie.html"
ck "GET /audit-ib.html"     curl -fs "${BASE}/audit-ib.html"
ck "GET /sertifikaciya-szi.html" curl -fs "${BASE}/sertifikaciya-szi.html"
ck "GET /zakupki-44fz.html" curl -fs "${BASE}/zakupki-44fz.html"
ck "GET /licenses.html"     curl -fs "${BASE}/licenses.html"
ck "GET /blog/"             curl -fs "${BASE}/blog/"
ck "GET /resources/"        curl -fs "${BASE}/resources/"
ck "GET /resources/checklist-kii-2026.html" curl -fs "${BASE}/resources/checklist-kii-2026.html"
ck "GET /regions/moscow.html"  curl -fs "${BASE}/regions/moscow.html"
ck "GET /regions/spb.html"     curl -fs "${BASE}/regions/spb.html"

echo
echo "[2] кабинет ИП"
ck "GET /kabinet/ → 200"      curl -fs "${BASE}/kabinet/"

echo
echo "[3] API лидов"
ck "POST /api/bez-it/leads (валидная заявка)" \
  curl -fs -X POST "${BASE}/api/bez-it/leads" \
    -H 'content-type: application/json' \
    -d '{"contactName":"Smoke Test","phone":"+79991234567","comment":"smoke","serviceKey":"kii","source":"smoke","website":""}'

ck "POST /api/bez-it/leads (honeypot спам)" \
  curl -fs -X POST "${BASE}/api/bez-it/leads" \
    -H 'content-type: application/json' \
    -d '{"contactName":"Bot","phone":"+79990000000","comment":"spam","serviceKey":"other","website":"http://spam.example/"}'

echo
echo "[4] кабинет API (требует токен)"
ck "GET /api/bez-it/cabinet/leads с токеном" \
  curl -fs -H "x-cabinet-token: ${TOKEN}" "${BASE}/api/bez-it/cabinet/leads"

echo
echo "=== Итого: passed=${PASS}, failed=${FAIL} ==="
[[ ${FAIL} -eq 0 ]] || exit 1
