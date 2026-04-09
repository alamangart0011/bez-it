#!/usr/bin/env bash
set -Eeuo pipefail

SSH_HOST="${SSH_HOST:-root@81.177.141.214}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/jino_messenger_key}"
PROJECT_DIR="${PROJECT_DIR:-/opt/messenger/contour-chat-jino-final}"
GIT_REF="${GIT_REF:-}"
TAIL_LOGS_LINES="${TAIL_LOGS_LINES:-120}"
LOCAL_MODE="${LOCAL_MODE:-auto}"

if [[ "$LOCAL_MODE" == "auto" ]]; then
  if [[ "$SSH_HOST" == "localhost" || "$SSH_HOST" == "127.0.0.1" || -d "$PROJECT_DIR" ]]; then
    LOCAL_MODE="1"
  else
    LOCAL_MODE="0"
  fi
fi

run_smoke_payload() {
  bash -s <<'REMOTE'
set -Eeuo pipefail
cd "$PROJECT_DIR"

if [[ -n "$GIT_REF" ]]; then
  echo "[INFO] git fetch/checkout: $GIT_REF"
  git fetch --all --prune
  if git rev-parse --verify "$GIT_REF" >/dev/null 2>&1; then
    git checkout "$GIT_REF"
  elif git rev-parse --verify "origin/$GIT_REF" >/dev/null 2>&1; then
    git checkout -B "$GIT_REF" "origin/$GIT_REF"
  else
    echo "[WARN] ref '$GIT_REF' not found, fallback to origin/main"
    git checkout -B main origin/main
  fi
fi

if [[ ! -f ./deploy/dev_room_smoke.sh ]]; then
  echo "[WARN] missing deploy/dev_room_smoke.sh, creating bootstrap copy"
  cat > ./deploy/dev_room_smoke.sh <<'EOS'
#!/usr/bin/env bash
set -Eeuo pipefail
BASE_URL="\${BASE_URL:-http://127.0.0.1:8080}"
LOGIN="\${LOGIN:-admin@corpchat.local}"
PASSWORD="\${PASSWORD:-admin123}"
docker compose up -d --build
docker compose ps
curl -fsS "\$BASE_URL/api/health" | jq .
curl -fsS "\$BASE_URL/api/release" | jq .
./deploy/post_deploy_check.sh
TOKEN="\$(curl -fsS -X POST "\$BASE_URL/api/auth/login" -H 'Content-Type: application/json' -d "{\\\"login\\\":\\\"\$LOGIN\\\",\\\"password\\\":\\\"\$PASSWORD\\\"}" | jq -r '.accessToken')"
ROOMS_JSON="\$(curl -fsS -H "Authorization: Bearer \$TOKEN" "\$BASE_URL/api/rooms")"
ROOM_ID="\$(echo "\$ROOMS_JSON" | jq -r '.[0].id // empty')"
if [[ -z "\$ROOM_ID" ]]; then
  ROOM_ID="\$(curl -fsS -X POST "\$BASE_URL/api/rooms" -H "Authorization: Bearer \$TOKEN" -H 'Content-Type: application/json' -d '{"name":"Комната команды","kind":"group","isPrivate":false}' | jq -r '.id')"
fi
curl -fsS -H "Authorization: Bearer \$TOKEN" "\$BASE_URL/api/rooms/\$ROOM_ID/members" | jq .
EOS
fi

chmod +x ./deploy/dev_room_smoke.sh ./deploy/post_deploy_check.sh
./deploy/dev_room_smoke.sh

echo "[INFO] tail api/web/db logs"
docker compose logs --tail "$TAIL_LOGS_LINES" api web db || true
REMOTE
}

if [[ "$LOCAL_MODE" == "1" ]]; then
  echo "[INFO] running room smoke in local mode: $PROJECT_DIR"
  PROJECT_DIR="$PROJECT_DIR" GIT_REF="$GIT_REF" TAIL_LOGS_LINES="$TAIL_LOGS_LINES" run_smoke_payload
else
  if [[ ! -f "$SSH_KEY" ]]; then
    echo "[ERR] SSH key not found: $SSH_KEY"
    exit 1
  fi
  echo "[INFO] running remote room smoke on $SSH_HOST:$PROJECT_DIR"
  ssh -i "$SSH_KEY" "$SSH_HOST" \
    "PROJECT_DIR='$PROJECT_DIR' GIT_REF='$GIT_REF' TAIL_LOGS_LINES='$TAIL_LOGS_LINES' bash -s" <<'REMOTE'
set -Eeuo pipefail
cd "$PROJECT_DIR"

if [[ -n "$GIT_REF" ]]; then
  echo "[INFO] git fetch/checkout: $GIT_REF"
  git fetch --all --prune
  if git rev-parse --verify "$GIT_REF" >/dev/null 2>&1; then
    git checkout "$GIT_REF"
  elif git rev-parse --verify "origin/$GIT_REF" >/dev/null 2>&1; then
    git checkout -B "$GIT_REF" "origin/$GIT_REF"
  else
    echo "[WARN] ref '$GIT_REF' not found, fallback to origin/main"
    git checkout -B main origin/main
  fi
fi

if [[ ! -f ./deploy/dev_room_smoke.sh ]]; then
  echo "[WARN] missing deploy/dev_room_smoke.sh, creating bootstrap copy"
  cat > ./deploy/dev_room_smoke.sh <<'EOS'
#!/usr/bin/env bash
set -Eeuo pipefail
BASE_URL="\${BASE_URL:-http://127.0.0.1:8080}"
LOGIN="\${LOGIN:-admin@corpchat.local}"
PASSWORD="\${PASSWORD:-admin123}"
docker compose up -d --build
docker compose ps
curl -fsS "\$BASE_URL/api/health" | jq .
curl -fsS "\$BASE_URL/api/release" | jq .
./deploy/post_deploy_check.sh
TOKEN="\$(curl -fsS -X POST "\$BASE_URL/api/auth/login" -H 'Content-Type: application/json' -d "{\\\"login\\\":\\\"\$LOGIN\\\",\\\"password\\\":\\\"\$PASSWORD\\\"}" | jq -r '.accessToken')"
ROOMS_JSON="\$(curl -fsS -H "Authorization: Bearer \$TOKEN" "\$BASE_URL/api/rooms")"
ROOM_ID="\$(echo "\$ROOMS_JSON" | jq -r '.[0].id // empty')"
if [[ -z "\$ROOM_ID" ]]; then
  ROOM_ID="\$(curl -fsS -X POST "\$BASE_URL/api/rooms" -H "Authorization: Bearer \$TOKEN" -H 'Content-Type: application/json' -d '{"name":"Комната команды","kind":"group","isPrivate":false}' | jq -r '.id')"
fi
curl -fsS -H "Authorization: Bearer \$TOKEN" "\$BASE_URL/api/rooms/\$ROOM_ID/members" | jq .
EOS
fi

chmod +x ./deploy/dev_room_smoke.sh ./deploy/post_deploy_check.sh
./deploy/dev_room_smoke.sh

echo "[INFO] tail api/web/db logs"
docker compose logs --tail "$TAIL_LOGS_LINES" api web db || true
REMOTE
fi

echo "[OK] remote room smoke done"
