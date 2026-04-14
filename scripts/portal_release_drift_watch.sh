#!/usr/bin/env bash
set -Eeuo pipefail

LOCAL_BASE_URL="${1:-http://127.0.0.1:8080}"
EXTERNAL_BASE_URL="${2:-${PORTAL_EXTERNAL_BASE_URL:-https://ai.voice.oboron-it.ru}}"

TMP_LOCAL_RELEASE="$(mktemp)"
TMP_EXTERNAL_RELEASE="$(mktemp)"
TMP_LOCAL_HEALTH="$(mktemp)"
TMP_EXTERNAL_HEALTH="$(mktemp)"
TMP_LOCAL_INDEX="$(mktemp)"
TMP_EXTERNAL_INDEX="$(mktemp)"
trap 'rm -f "$TMP_LOCAL_RELEASE" "$TMP_EXTERNAL_RELEASE" "$TMP_LOCAL_HEALTH" "$TMP_EXTERNAL_HEALTH" "$TMP_LOCAL_INDEX" "$TMP_EXTERNAL_INDEX"' EXIT

curl -fsS "$LOCAL_BASE_URL/api/release" > "$TMP_LOCAL_RELEASE"
curl -fsS "$EXTERNAL_BASE_URL/api/release" > "$TMP_EXTERNAL_RELEASE"
curl -fsS "$LOCAL_BASE_URL/api/health" > "$TMP_LOCAL_HEALTH"
curl -fsS "$EXTERNAL_BASE_URL/api/health" > "$TMP_EXTERNAL_HEALTH"
curl -fsS "$LOCAL_BASE_URL/" > "$TMP_LOCAL_INDEX"
curl -fsS "$EXTERNAL_BASE_URL/" > "$TMP_EXTERNAL_INDEX"

python3 - "$TMP_LOCAL_RELEASE" "$TMP_EXTERNAL_RELEASE" "$TMP_LOCAL_HEALTH" "$TMP_EXTERNAL_HEALTH" "$TMP_LOCAL_INDEX" "$TMP_EXTERNAL_INDEX" <<'PY'
import json, re, sys
local_release = json.load(open(sys.argv[1], 'r', encoding='utf-8'))
external_release = json.load(open(sys.argv[2], 'r', encoding='utf-8'))
local_health = json.load(open(sys.argv[3], 'r', encoding='utf-8'))
external_health = json.load(open(sys.argv[4], 'r', encoding='utf-8'))
local_index = open(sys.argv[5], 'r', encoding='utf-8').read()
external_index = open(sys.argv[6], 'r', encoding='utf-8').read()
asset_re = re.compile(r'assets/index-[^" ]*\.js')
local_asset = asset_re.search(local_index)
external_asset = asset_re.search(external_index)
summary = {
  'local_release_version': local_release.get('releaseVersion') or local_release.get('release') or local_release.get('version'),
  'external_release_version': external_release.get('releaseVersion') or external_release.get('release') or external_release.get('version'),
  'local_release_channel': local_release.get('releaseChannel') or local_release.get('channel'),
  'external_release_channel': external_release.get('releaseChannel') or external_release.get('channel'),
  'local_health_ok': local_health.get('ok', True),
  'external_health_ok': external_health.get('ok', True),
  'local_asset': local_asset.group(0) if local_asset else None,
  'external_asset': external_asset.group(0) if external_asset else None,
}
summary['release_match'] = summary['local_release_version'] == summary['external_release_version'] and summary['local_release_channel'] == summary['external_release_channel']
summary['asset_match'] = summary['local_asset'] == summary['external_asset']
print(json.dumps(summary, ensure_ascii=False, indent=2))
if not (summary['release_match'] and summary['asset_match'] and summary['local_health_ok'] and summary['external_health_ok']):
    raise SystemExit(2)
PY

echo "[OK] portal release drift watch passed"
