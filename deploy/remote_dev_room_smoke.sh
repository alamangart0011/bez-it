#!/usr/bin/env bash
set -Eeuo pipefail

SSH_HOST="${SSH_HOST:-root@81.177.141.214}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/jino_messenger_key}"
PROJECT_DIR="${PROJECT_DIR:-/opt/messenger/contour-chat-jino-final}"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "[ERR] SSH key not found: $SSH_KEY"
  exit 1
fi

echo "[INFO] running remote room smoke on $SSH_HOST:$PROJECT_DIR"
ssh -i "$SSH_KEY" "$SSH_HOST" "bash -s" <<REMOTE
set -Eeuo pipefail
cd "$PROJECT_DIR"

if [[ ! -f ./deploy/dev_room_smoke.sh ]]; then
  echo "[ERR] missing deploy/dev_room_smoke.sh in project"
  exit 1
fi

chmod +x ./deploy/dev_room_smoke.sh ./deploy/post_deploy_check.sh
./deploy/dev_room_smoke.sh
REMOTE

echo "[OK] remote room smoke done"
