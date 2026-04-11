#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-/opt/messenger/contour-chat-jino-final}"
BRANCH="${BRANCH:-project/signalum-voice-foundation-20260410}"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_ROOT="/root/backups/${STAMP}"

mkdir -p "$BACKUP_ROOT"
cd "$BASE"

echo "[1/7] backup repo and nginx"
cp -a . "$BACKUP_ROOT/repo_backup"
cp -a /etc/nginx/conf.d/ai.voice.oboron-it.ru.conf "$BACKUP_ROOT/ai.voice.oboron-it.ru.conf.bak" || true

echo "[2/7] fetch and switch canonical branch"
git fetch origin '+refs/heads/*:refs/remotes/origin/*' --prune
git checkout -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"

echo "[3/7] align live database coordinates"
python3 - <<'PY'
from pathlib import Path
p = Path('.env')
raw = p.read_text(encoding='utf-8') if p.exists() else ''
lines = raw.splitlines()
replacements = {
    'POSTGRES_DB': 'signalum',
    'POSTGRES_USER': 'signalum',
    'POSTGRES_PASSWORD': 'signalum',
    'POSTGRES_HOST': 'db',
    'POSTGRES_PORT': '5432',
    'DATABASE_URL': 'postgresql://signalum:signalum@postgres:5432/signalum',
    'API_PORT': '3001',
    'CORS_ORIGIN': 'https://ai.voice.oboron-it.ru',
    'HEALTH_EXTERNAL_URL': 'https://ai.voice.oboron-it.ru/api/health',
}
out=[]
seen=set()
for line in lines:
    if '=' in line and not line.lstrip().startswith('#'):
        k,v=line.split('=',1)
        k=k.strip()
        if k in replacements:
            out.append(f'{k}={replacements[k]}')
            seen.add(k)
        else:
            out.append(line)
    else:
        out.append(line)
for k,v in replacements.items():
    if k not in seen:
        out.append(f'{k}={v}')
p.write_text('\n'.join(out)+'\n', encoding='utf-8')
print(p.read_text(encoding='utf-8'))
PY

echo "[4/7] rebuild compose"
docker compose down --remove-orphans || true
docker compose build --no-cache api web
docker compose up -d db api
sleep 15

echo "[5/7] wait api health"
for i in $(seq 1 20); do
  if docker compose exec -T api sh -lc 'wget -qO- http://127.0.0.1:3001/api/health >/dev/null 2>&1'; then
    echo "[OK] api health on attempt $i"
    break
  fi
  sleep 3
done

echo "[6/7] start web and restore http nginx"
docker compose up -d web
sleep 10
bash scripts/jino_http_restore.sh

echo "[7/7] smoke"
bash scripts/jino_proxy_probe.sh
bash scripts/jino_https_smoke.sh
bash scripts/jino_release_status.sh

echo "[DONE] cutover apply complete"
echo "[INFO] backup saved to $BACKUP_ROOT"
