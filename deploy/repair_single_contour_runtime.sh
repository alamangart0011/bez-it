#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/messenger/contour-chat-jino-final}"
cd "$APP_DIR"

if [ -d scripts ]; then
  cat > scripts/smoke_web_entry.sh <<'SH'
#!/usr/bin/env bash
set -Eeuo pipefail
BASE_URL="${1:-http://127.0.0.1:8080}"
check() { echo "[SMOKE-WEB] $1 -> $2"; curl -fsS "$2" >/dev/null; }
check health "$BASE_URL/api/health"
check live "$BASE_URL/api/live"
check ready "$BASE_URL/api/ready"
check release "$BASE_URL/api/release"
echo "[OK] web entry smoke passed"
SH
  chmod +x scripts/smoke_web_entry.sh || true
fi

python3 - <<'PY'
from pathlib import Path
p = Path('deploy/deploy.sh')
text = p.read_text(encoding='utf-8')
old = './scripts/smoke_api.sh http://127.0.0.1:3001'
new = './scripts/smoke_web_entry.sh http://127.0.0.1:8080'
if old in text:
    text = text.replace(old, new)
p.write_text(text, encoding='utf-8')
PY

cat > deploy/BASELINE.lock <<'LOCK'
BASELINE=room-based-v17
STATE=SINGLE_CONTOUR_CANONICAL
DOMAIN=https://ai.voice.oboron-it.ru
ROOT=/opt/messenger/contour-chat-jino-final
RULE_SINGLE_DEPLOY_PATH=true
PREVIEW_DISABLED=true
LOCK

chown -R deploy:deploy "$APP_DIR" || true
chmod +x deploy/*.sh || true
chmod +x scripts/*.sh || true

echo '[OK] single contour runtime repaired'
echo '[INFO] deploy smoke path -> 127.0.0.1:8080 via web entry'
