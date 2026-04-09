#!/usr/bin/env bash
set -Eeuo pipefail

REMOTE_ALIAS="${1:-jino-messenger}"
BASE_DIR="${2:-/opt/messenger/contour-chat-jino-final}"
TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="$HOME/Desktop/signalum_full_snapshot_${TS}"
MAC_DIR="$OUT_DIR/mac"
REMOTE_DIR="$OUT_DIR/jino"
mkdir -p "$MAC_DIR" "$REMOTE_DIR" "$OUT_DIR/artifacts"

log() { printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
write_cmd() {
  local out="$1"; shift
  {
    echo "$ $*"
    "$@"
  } >"$out" 2>&1 || true
}

log "Collecting mac context"
write_cmd "$MAC_DIR/01_uname.txt" uname -a
write_cmd "$MAC_DIR/02_pwd.txt" pwd
write_cmd "$MAC_DIR/03_env_path.txt" bash -lc 'printf "%s\n" "$PATH"'
write_cmd "$MAC_DIR/04_ls_downloads.txt" bash -lc 'ls -lah "$HOME/Downloads" | sed -n "1,200p"'
write_cmd "$MAC_DIR/05_ls_desktop.txt" bash -lc 'ls -lah "$HOME/Desktop" | sed -n "1,200p"'
write_cmd "$MAC_DIR/06_ssh_config_ls.txt" bash -lc 'ls -lah "$HOME/.ssh" | sed -n "1,200p"'

if [ -f "$HOME/.zsh_history" ]; then cp "$HOME/.zsh_history" "$MAC_DIR/.zsh_history"; fi
if [ -f "$HOME/.bash_history" ]; then cp "$HOME/.bash_history" "$MAC_DIR/.bash_history"; fi

log "Collecting remote context from $REMOTE_ALIAS"
ssh "$REMOTE_ALIAS" "mkdir -p /tmp/signalum_snapshot_${TS}" >/dev/null 2>&1 || true
ssh "$REMOTE_ALIAS" "bash -lc '
set +e
BASE_DIR=\"$BASE_DIR\"
OUT=\"/tmp/signalum_snapshot_${TS}\"
mkdir -p \"$OUT\"
{
  echo \"=== SYSTEM ===\"; uname -a; id; whoami; hostname; pwd;
  echo; echo \"=== DATE ===\"; date;
  echo; echo \"=== BASE DIR ===\"; ls -lah \"$BASE_DIR\" | sed -n \"1,200p\";
} > \"$OUT/01_system.txt\" 2>&1
{
  echo \"=== GIT STATUS ===\"; cd \"$BASE_DIR\" && git status --short && echo && git branch --show-current && echo && git remote -v && echo && git log --oneline --decorate -n 30;
} > \"$OUT/02_git.txt\" 2>&1
{
  echo \"=== DOCKER PS ===\"; cd \"$BASE_DIR\" && docker compose ps; echo; echo \"=== DOCKER IMAGES ===\"; docker images | sed -n \"1,120p\";
} > \"$OUT/03_docker.txt\" 2>&1
{
  echo \"=== API LOGS ===\"; cd \"$BASE_DIR\" && docker compose logs api --tail=400; echo; echo \"=== WEB LOGS ===\"; docker compose logs web --tail=300; echo; echo \"=== DB LOGS ===\"; docker compose logs db --tail=300;
} > \"$OUT/04_logs.txt\" 2>&1
{
  echo \"=== TREE ===\"; cd \"$BASE_DIR\" && find . -maxdepth 3 | sed -n \"1,500p\";
} > \"$OUT/05_tree.txt\" 2>&1
{
  cd \"$BASE_DIR\"
  echo \"=== docker-compose.yml ===\"; sed -n \"1,240p\" docker-compose.yml
  echo; echo \"=== backend/src/routes/rooms.js ===\"; sed -n \"1,260p\" backend/src/routes/rooms.js
  echo; echo \"=== backend/src/routes/auth.js ===\"; sed -n \"1,260p\" backend/src/routes/auth.js
  echo; echo \"=== backend/src/validators/rooms.validators.js ===\"; sed -n \"1,220p\" backend/src/validators/rooms.validators.js
  echo; echo \"=== frontend/src/App.jsx ===\"; sed -n \"1,320p\" frontend/src/App.jsx
  echo; echo \"=== deploy/dev_room_smoke.sh ===\"; sed -n \"1,260p\" deploy/dev_room_smoke.sh
} > \"$OUT/06_key_files.txt\" 2>&1
{
  cd \"$BASE_DIR\"
  echo \"=== HEALTH ===\"; curl -i -sS http://127.0.0.1:8080/api/health || true
  echo; echo \"=== RELEASE ===\"; curl -i -sS http://127.0.0.1:8080/api/release || true
  echo; echo \"=== LOGIN ===\"; curl -i -sS -X POST http://127.0.0.1:8080/api/auth/login -H \"Content-Type: application/json\" -d '{\"login\":\"admin@corpchat.local\",\"password\":\"Admin@12345!\"}' || true
} > \"$OUT/08_api_smoke.txt\" 2>&1
{
  cd \"$BASE_DIR\"
  docker compose exec -T db sh -lc 'psql -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\" -c """SELECT table_name FROM information_schema.tables WHERE table_schema='"'"'public'"'"' ORDER BY table_name;"""'
  echo
  for t in users rooms messages room_members room_memberships voice_participants user_profiles departments invitations system_settings room_incidents auth_sessions meetings meeting_events audit_logs; do
    echo \"=== $t ===\"
    docker compose exec -T db sh -lc \"psql -U \\\"\\$POSTGRES_USER\\\" -d \\\"\\$POSTGRES_DB\\\" -c 'SELECT * FROM information_schema.columns WHERE table_schema='"'"'public'"'"' AND table_name='"'"'$t'"'"' ORDER BY ordinal_position;'\" || true
    echo
  done
} > \"$OUT/09_db_schema.txt\" 2>&1
{
  cd \"$BASE_DIR\"
  if [ -f .env ]; then sed -E 's/(PASSWORD|SECRET|TOKEN|KEY)=.*/\1=REDACTED/g' .env; fi
} > \"$OUT/10_env_redacted.txt\" 2>&1

tar -czf /tmp/signalum_snapshot_${TS}.tar.gz -C /tmp signalum_snapshot_${TS}
'"
scp "$REMOTE_ALIAS:/tmp/signalum_snapshot_${TS}.tar.gz" "$OUT_DIR/artifacts/" >/dev/null 2>&1 || true
if [ -f "$OUT_DIR/artifacts/signalum_snapshot_${TS}.tar.gz" ]; then tar -xzf "$OUT_DIR/artifacts/signalum_snapshot_${TS}.tar.gz" -C "$OUT_DIR" >/dev/null 2>&1 || true; fi
( cd "$OUT_DIR" && tar -czf "$HOME/Desktop/signalum_full_snapshot_${TS}.tar.gz" . )
if command -v zip >/dev/null 2>&1; then ( cd "$OUT_DIR" && zip -qr "$HOME/Desktop/signalum_full_snapshot_${TS}.zip" . ) || true; fi

echo "$HOME/Desktop/signalum_full_snapshot_${TS}.tar.gz"
