#!/usr/bin/env bash
# bez-it.ru — uptime-монитор, шлёт алерт в Telegram при сбое.
# Проверяет 3 URL (bez-it.ru, kabinet, API). Алерт только при СМЕНЕ состояния (up→down или down→up).
# Запуск:
#   bash deploy/jino-uptime.sh           — один прогон
#   bash deploy/jino-uptime.sh --install — установить cron (каждые 5 минут)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bez-it}"
STATE_DIR="${APP_DIR}/.uptime"
mkdir -p "${STATE_DIR}"

if [[ "${1:-}" == "--install" ]]; then
  CRON_LINE="*/5 * * * * root /bin/bash ${APP_DIR}/deploy/jino-uptime.sh >> ${APP_DIR}/.uptime/uptime.log 2>&1"
  echo "${CRON_LINE}" > /etc/cron.d/bez-it-uptime
  chmod 644 /etc/cron.d/bez-it-uptime
  echo "✓ /etc/cron.d/bez-it-uptime установлен (каждые 5 минут)"
  exit 0
fi

if [[ -f "${APP_DIR}/ops/bez-it-sandbox/.env" ]]; then
  set -a; . "${APP_DIR}/ops/bez-it-sandbox/.env"; set +a || true
fi

TOKEN="${BEZIT_TG_BOT_TOKEN:-}"
CHAT="${BEZIT_TG_IP_CHAT:-}"

notify() {
  [[ -z "$TOKEN" || -z "$CHAT" ]] && return 0
  curl -fsS -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d "chat_id=${CHAT}" \
    --data-urlencode "text=$1" >/dev/null || true
}

check() {
  local name="$1" url="$2" expected="$3"
  local state_file="${STATE_DIR}/$(echo "$name" | tr '/:.' '___')"
  local prev="up"
  [[ -f "$state_file" ]] && prev=$(cat "$state_file")

  local code
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)

  local cur
  if [[ "$code" == "$expected" ]] || [[ "$expected" == "2xx" && "$code" =~ ^2 ]]; then
    cur="up"
  else
    cur="down"
  fi

  echo "$cur" > "$state_file"

  if [[ "$prev" != "$cur" ]]; then
    local emoji="✅" verb="ВОССТАНОВЛЕН"
    [[ "$cur" == "down" ]] && emoji="🚨" verb="УПАЛ"
    local msg="${emoji} ${name} ${verb}
URL: ${url}
HTTP: ${code}
время: $(date +'%Y-%m-%d %H:%M:%S %Z')"
    notify "$msg"
    echo "[ALERT] $name $prev → $cur (HTTP $code)"
  else
    echo "[ok] $name → $cur (HTTP $code)"
  fi
}

check "bez-it.ru"            "https://bez-it.ru/"                            "2xx"
check "kabinet.bez-it.ru"    "https://kabinet.bez-it.ru/"                    "2xx"
check "API /leads (health)"  "https://bez-it.ru/api/bez-it/leads"            "404"  # POST-only endpoint, 404 на GET = API жив
check "cert expiry (30д)"    "https://bez-it.ru/"                            "2xx"

# Дополнительная проверка срока истечения SSL-сертификата
DAYS_LEFT=$(echo | openssl s_client -servername bez-it.ru -connect bez-it.ru:443 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null \
  | awk -F= '/notAfter/{cmd="date -d \""$2"\" +%s"; cmd | getline t; now=systime(); print int((t-now)/86400)}')
if [[ -n "${DAYS_LEFT:-}" ]] && [[ "${DAYS_LEFT}" -lt 14 ]]; then
  notify "⚠️ SSL bez-it.ru истекает через ${DAYS_LEFT} дней!"
  echo "[ALERT] cert истекает через ${DAYS_LEFT} дней"
else
  echo "[ok] cert (${DAYS_LEFT:-?} дней до истечения)"
fi
