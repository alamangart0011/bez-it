#!/usr/bin/env bash
set -Eeuo pipefail

KEY_PATH="${1:-$HOME/.ssh/jino_messenger_key}"
SSH_CONFIG_PATH="${2:-$HOME/.ssh/config}"
HOST_ALIAS="${3:-jino-messenger}"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [ ! -f "$KEY_PATH" ]; then
  echo "ERROR: key not found: $KEY_PATH" >&2
  exit 1
fi

chmod 600 "$KEY_PATH" || true

touch "$SSH_CONFIG_PATH"
chmod 600 "$SSH_CONFIG_PATH"

python3 - "$SSH_CONFIG_PATH" "$HOST_ALIAS" "$KEY_PATH" <<'PY'
from pathlib import Path
import sys

cfg_path = Path(sys.argv[1])
host_alias = sys.argv[2]
key_path = sys.argv[3]
text = cfg_path.read_text(encoding='utf-8', errors='ignore') if cfg_path.exists() else ''
lines = text.splitlines()
out = []
i = 0
found = False
while i < len(lines):
    line = lines[i]
    if line.strip().lower() == f'host {host_alias}'.lower():
        found = True
        i += 1
        while i < len(lines) and not lines[i].strip().lower().startswith('host '):
            i += 1
        if out and out[-1].strip():
            pass
        out.extend([
            f'Host {host_alias}',
            '  HostName 81.177.141.214',
            '  User root',
            f'  IdentityFile {key_path}',
            '  IdentitiesOnly yes',
            '  AddKeysToAgent yes',
            '  UseKeychain yes',
        ])
        continue
    out.append(line)
    i += 1
if not found:
    if out and out[-1].strip():
        out.append('')
    out.extend([
        f'Host {host_alias}',
        '  HostName 81.177.141.214',
        '  User root',
        f'  IdentityFile {key_path}',
        '  IdentitiesOnly yes',
        '  AddKeysToAgent yes',
        '  UseKeychain yes',
    ])
cfg_path.write_text('\n'.join(out).rstrip() + '\n', encoding='utf-8')
PY

if ! pgrep -u "$USER" ssh-agent >/dev/null 2>&1; then
  eval "$(ssh-agent -s)" >/dev/null
fi

ssh-add --apple-use-keychain "$KEY_PATH"

echo "OK: key added to agent and Keychain"
echo "Test: ssh $HOST_ALIAS 'echo ok'"
