#!/usr/bin/env bash
# IndexNow ping — уведомляет Yandex/Bing об обновлении контента bez-it.ru
# Запуск:
#   bash deploy/jino-indexnow-ping.sh
# (можно в post-deploy или раз в день по cron)
set -euo pipefail

HOST="bez-it.ru"
KEY="a3b6f03767b256851c6dc46315dff3e39eb4dd399c4251ba67c06b0d9c940cbd"
KEY_LOCATION="https://${HOST}/${KEY}.txt"

# URL-ы, которые пушим в IndexNow. Для объёмной пачки (>10k) — используйте sitemap ping.
URLS_JSON=$(cat <<'EOF'
{
  "host": "bez-it.ru",
  "key": "KEY_PLACEHOLDER",
  "keyLocation": "KEY_LOCATION_PLACEHOLDER",
  "urlList": [
    "https://bez-it.ru/",
    "https://bez-it.ru/kii-2026.html",
    "https://bez-it.ru/ispdn-152fz.html",
    "https://bez-it.ru/fstek-attestaciya.html",
    "https://bez-it.ru/skzi-razrabotka.html",
    "https://bez-it.ru/sertifikaciya-szi.html",
    "https://bez-it.ru/importozameshenie-szi.html",
    "https://bez-it.ru/gossopka-podklyuchenie.html",
    "https://bez-it.ru/audit-ib.html",
    "https://bez-it.ru/zakupki-44fz.html",
    "https://bez-it.ru/it-autsorsing.html",
    "https://bez-it.ru/skud-videonablyudenie.html",
    "https://bez-it.ru/regions/moscow.html",
    "https://bez-it.ru/regions/spb.html",
    "https://bez-it.ru/regions/ekaterinburg.html",
    "https://bez-it.ru/regions/kazan.html",
    "https://bez-it.ru/regions/novosibirsk.html",
    "https://bez-it.ru/regions/krasnodar.html",
    "https://bez-it.ru/regions/rostov.html",
    "https://bez-it.ru/regions/nizhny-novgorod.html",
    "https://bez-it.ru/regions/samara.html",
    "https://bez-it.ru/regions/ufa.html",
    "https://bez-it.ru/regions/perm.html",
    "https://bez-it.ru/regions/voronezh.html",
    "https://bez-it.ru/regions/volgograd.html",
    "https://bez-it.ru/regions/chelyabinsk.html",
    "https://bez-it.ru/regions/krasnoyarsk.html",
    "https://bez-it.ru/regions/saratov.html",
    "https://bez-it.ru/regions/tyumen.html",
    "https://bez-it.ru/regions/izhevsk.html",
    "https://bez-it.ru/regions/barnaul.html",
    "https://bez-it.ru/regions/kaliningrad.html",
    "https://bez-it.ru/blog/",
    "https://bez-it.ru/blog/kii-kateg-instrukciya.html",
    "https://bez-it.ru/blog/shtrafy-2026-praktika.html",
    "https://bez-it.ru/blog/importozameshenie-checklist.html",
    "https://bez-it.ru/blog/utechki-pdn-152fz-2026.html",
    "https://bez-it.ru/blog/gossopka-30-dney.html",
    "https://bez-it.ru/blog/274-1-uk-rf-praktika.html",
    "https://bez-it.ru/blog/kak-vybrat-litsenziata-fstek.html",
    "https://bez-it.ru/resources/",
    "https://bez-it.ru/resources/checklist-kii-2026.html",
    "https://bez-it.ru/resources/templates-orderlist-ispdn.html",
    "https://bez-it.ru/resources/incident-runbook.html",
    "https://bez-it.ru/resources/import-replacement-matrix.html",
    "https://bez-it.ru/regions/",
    "https://bez-it.ru/partners.html"
  ]
}
EOF
)
URLS_JSON="${URLS_JSON//KEY_PLACEHOLDER/$KEY}"
URLS_JSON="${URLS_JSON//KEY_LOCATION_PLACEHOLDER/$KEY_LOCATION}"

echo "=== IndexNow → api.indexnow.org ==="
curl -fsS -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$URLS_JSON" && echo "  ✓ api.indexnow.org принял" || echo "  ✗ api.indexnow.org FAIL"

echo
echo "=== IndexNow → yandex.com/indexnow ==="
curl -fsS -X POST "https://yandex.com/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$URLS_JSON" && echo "  ✓ yandex.com принял" || echo "  ✗ yandex.com FAIL"

echo
echo "=== sitemap ping → yandex (classic protocol) ==="
curl -fsS "https://webmaster.yandex.ru/ping?sitemap=https://bez-it.ru/sitemap.xml" \
  && echo "  ✓ yandex sitemap ping" || echo "  ✗ FAIL (требует подтверждения в Вебмастере)"

echo
echo "Done."
