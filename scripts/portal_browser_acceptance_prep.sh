#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-https://ai.voice.oboron-it.ru}"
LOGIN_ONE="${2:-${PORTAL_BROWSER_LOGIN_ONE:-leader@signalum.local}}"
LOGIN_TWO="${3:-${PORTAL_BROWSER_LOGIN_TWO:-member@signalum.local}}"
VOICE_ROOM_NAME="${4:-Голосовой контур}"
MEETING_ROOM_NAME="${5:-Зал собраний}"

TS="$(date +%s)"
URL_ONE="${BASE_URL}/?v=${TS}"
URL_TWO="${BASE_URL}/?v=${TS}&mode=incognito"

cat <<EOF
BROWSER_ACCEPTANCE_PREP
BASE_URL=$BASE_URL
URL_ONE=$URL_ONE
URL_TWO=$URL_TWO
LOGIN_ONE=$LOGIN_ONE
LOGIN_TWO=$LOGIN_TWO
VOICE_ROOM_NAME=$VOICE_ROOM_NAME
MEETING_ROOM_NAME=$MEETING_ROOM_NAME
CHECKLIST=1) открыть обычное окно 2) открыть инкогнито 3) войти под двумя пользователями 4) открыть голосовую комнату 5) войти в голос 6) проверить meeting room
EOF

echo "[OK] portal browser acceptance prep ready"
