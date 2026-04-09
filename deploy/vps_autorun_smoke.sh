#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-}"
GIT_REF="${GIT_REF:-}"
EXPECTED_REPO_SLUG="${EXPECTED_REPO_SLUG:-contour-chat-v17}"

discover_project_dir() {
  local candidates=(
    "/opt/messenger/contour-chat-jino-final"
    "/opt/messenger/contour-chat-v17"
    "/opt/contour-chat-jino-final"
    "/opt/contour-chat-v17"
  )

  local p
  for p in "${candidates[@]}"; do
    if [[ -f "$p/deploy/remote_dev_room_smoke.sh" && -f "$p/docker-compose.yml" && -d "$p/.git" ]]; then
      printf '%s\n' "$p"
      return 0
    fi
  done

  p="$(find /opt -maxdepth 4 -type f -path '*/deploy/remote_dev_room_smoke.sh' 2>/dev/null | head -n1 || true)"
  if [[ -n "$p" ]]; then
    dirname "$(dirname "$p")"
    return 0
  fi

  return 1
}

validate_repo_identity() {
  local dir="$1"
  local remote_url
  remote_url="$(git -C "$dir" remote get-url origin 2>/dev/null || true)"
  if [[ "$remote_url" == *"$EXPECTED_REPO_SLUG"* ]]; then
    return 0
  fi
  return 1
}

if [[ -z "$PROJECT_DIR" || ! -d "$PROJECT_DIR" ]]; then
  PROJECT_DIR="$(discover_project_dir || true)"
fi

if [[ -z "$PROJECT_DIR" || ! -d "$PROJECT_DIR" ]]; then
  echo "[ERR] project dir not found. Set PROJECT_DIR manually."
  exit 1
fi

if ! validate_repo_identity "$PROJECT_DIR"; then
  echo "[ERR] wrong repo in PROJECT_DIR=$PROJECT_DIR (expected slug: $EXPECTED_REPO_SLUG)"
  echo "[ERR] set PROJECT_DIR explicitly for contour-chat-v17 repo"
  exit 1
fi

echo "[INFO] project: $PROJECT_DIR"
cd "$PROJECT_DIR"

if [[ -z "$GIT_REF" ]]; then
  GIT_REF="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || true)"
  GIT_REF="${GIT_REF:-main}"
fi

echo "[INFO] git sync from origin"
git fetch --all --prune
if git rev-parse --verify "origin/$GIT_REF" >/dev/null 2>&1; then
  git checkout -B "$GIT_REF" "origin/$GIT_REF"
else
  echo "[WARN] origin/$GIT_REF not found, fallback to origin/main"
  git checkout -B main origin/main
  GIT_REF="main"
fi

echo "[INFO] current commit: $(git rev-parse --short HEAD)"
chmod +x ./deploy/remote_dev_room_smoke.sh ./deploy/dev_room_smoke.sh ./deploy/post_deploy_check.sh

if grep -q 'LOCAL_MODE=' ./deploy/remote_dev_room_smoke.sh 2>/dev/null; then
  echo "[INFO] run smoke in LOCAL_MODE via remote_dev_room_smoke.sh"
  LOCAL_MODE=1 GIT_REF="$GIT_REF" ./deploy/remote_dev_room_smoke.sh
else
  echo "[WARN] old remote_dev_room_smoke.sh without LOCAL_MODE, fallback to dev_room_smoke.sh"
  ./deploy/dev_room_smoke.sh
fi

echo "[OK] vps autorun smoke completed"
