#!/usr/bin/env bash
# bez-it.ru — бэкап PostgreSQL + ротация + (опц.) отправка в Telegram
# Запуск:
#   bash deploy/jino-backup.sh           — один бэкап + ротация
#   bash deploy/jino-backup.sh --install — установить в cron (ежедневно в 03:17)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bez-it}"
BACKUP_DIR="${APP_DIR}/backups"
KEEP_DAYS="${KEEP_DAYS:-30}"

log() { echo -e "[$(date +%Y-%m-%d\ %H:%M:%S)] $*"; }
err() { echo -e "[$(date +%Y-%m-%d\ %H:%M:%S)] [ERROR] $*" >&2; }

if [[ "${1:-}" == "--install" ]]; then
  log "устанавливаю cron-задачу на ежедневный бэкап в 03:17"
  CRON_LINE="17 3 * * * root /bin/bash ${APP_DIR}/deploy/jino-backup.sh >> ${APP_DIR}/backups/backup.log 2>&1"
  mkdir -p "${BACKUP_DIR}"
  echo "${CRON_LINE}" > /etc/cron.d/bez-it-backup
  chmod 644 /etc/cron.d/bez-it-backup
  log "✓ /etc/cron.d/bez-it-backup установлен"
  log "  следующий запуск: ежедневно в 03:17"
  exit 0
fi

mkdir -p "${BACKUP_DIR}"

STAMP=$(date +%Y%m%d-%H%M%S)
OUT="${BACKUP_DIR}/bezit-${STAMP}.sql.gz"

log "=== бэкап БД bezit → ${OUT} ==="
if ! docker exec bez-it-db pg_isready -U "${BEZIT_DB_USER:-bezit}" >/dev/null 2>&1; then
  err "bez-it-db не отвечает"
  exit 1
fi

docker exec bez-it-db pg_dump -U "${BEZIT_DB_USER:-bezit}" -d "${BEZIT_DB_NAME:-bezit}" \
  | gzip -9 > "${OUT}"

SIZE=$(du -h "${OUT}" | cut -f1)
log "✓ готов: ${OUT} (${SIZE})"

# ротация
log "=== ротация (старше ${KEEP_DAYS} дней) ==="
find "${BACKUP_DIR}" -type f -name "bezit-*.sql.gz" -mtime +${KEEP_DAYS} -print -delete || true

# опциональная отправка в Telegram, если заданы BEZIT_TG_BOT_TOKEN и BEZIT_TG_IP_CHAT
if [[ -f "${APP_DIR}/ops/bez-it-sandbox/.env" ]]; then
  # shellcheck source=/dev/null
  set -a; . "${APP_DIR}/ops/bez-it-sandbox/.env"; set +a || true
fi

if [[ -n "${BEZIT_TG_BOT_TOKEN:-}" && -n "${BEZIT_TG_IP_CHAT:-}" ]]; then
  MSG="✅ bez-it.ru backup
$(basename "${OUT}")
размер: ${SIZE}
хранится: ${KEEP_DAYS} дней"
  curl -fsS -X POST "https://api.telegram.org/bot${BEZIT_TG_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${BEZIT_TG_IP_CHAT}" \
    --data-urlencode "text=${MSG}" >/dev/null && log "✓ Telegram notify sent" || log "Telegram notify skipped"
fi

log "=== текущие бэкапы ==="
ls -lh "${BACKUP_DIR}" | tail -n +2 | head -20
