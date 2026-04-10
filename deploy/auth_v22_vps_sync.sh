#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${1:-/opt/messenger/contour-chat-jino-final}"
BRANCH="${2:-main}"

need_file() {
  local path="$1"
  if [ ! -f "$APP_DIR/$path" ]; then
    echo "[MISS] $path"
    return 1
  fi
  echo "[OK]   $path"
}

echo "[auth-v22] app dir: $APP_DIR"
cd "$APP_DIR"

echo "[auth-v22] git fetch"
git fetch --all --prune || true

echo "[auth-v22] current branch: $(git branch --show-current || true)"
echo "[auth-v22] target branch:  $BRANCH"

echo "[auth-v22] git status"
git status --short || true

echo "[auth-v22] checking files"
rc=0
need_file "frontend/src/auth/AuthV22Extensions.jsx" || rc=1
need_file "frontend/src/auth/AuthPhoneV22Extensions.jsx" || rc=1
need_file "frontend/src/auth/AuthPhoneV22Adapters.js" || rc=1
need_file "frontend/src/auth/AuthV22AppBridge.js" || rc=1
need_file "frontend/src/auth/AuthRootV22Bridge.js" || rc=1
need_file "backend/src/services/auth.device.js" || rc=1
need_file "backend/src/services/auth.phone.sms.js" || rc=1
need_file "backend/src/services/auth.phone.presenters.js" || rc=1
need_file "backend/src/validators/auth.phone.validators.js" || rc=1
need_file "backend/src/routes/auth.phone.routes.js" || rc=1
need_file "backend/src/routes/auth.phone.attach.js" || rc=1
need_file "backend/src/auth/AuthRouterV22Bridge.js" || rc=1

if [ "$rc" -ne 0 ]; then
  echo "[auth-v22] some files are missing"
  exit 1
fi

echo "[auth-v22] done"
