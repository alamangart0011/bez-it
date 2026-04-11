#!/usr/bin/env bash
set -Eeuo pipefail

HOST="${1:-ai.voice.oboron-it.ru}"
OUTDIR="${2:-./support_bundle_$(date +%Y%m%d_%H%M%S)}"
mkdir -p "$OUTDIR"

{
  echo "=== host ==="
  echo "$HOST"
  echo
  echo "=== date ==="
  date -Is
  echo
  echo "=== tcp 80 ==="
  ( timeout 5 bash -lc "</dev/tcp/${HOST}/80" && echo "80=open" ) || echo "80=closed"
  echo
  echo "=== tcp 443 ==="
  ( timeout 5 bash -lc "</dev/tcp/${HOST}/443" && echo "443=open" ) || echo "443=closed"
} > "$OUTDIR/network.txt" 2>&1

curl -i "http://${HOST}/api/health" > "$OUTDIR/http_api_health.txt" 2>&1 || true
curl -I "http://${HOST}" > "$OUTDIR/http_root_head.txt" 2>&1 || true
curl -k -I "https://${HOST}" > "$OUTDIR/https_root_head.txt" 2>&1 || true
curl -k -i "https://${HOST}/api/health" > "$OUTDIR/https_api_health.txt" 2>&1 || true

cat > "$OUTDIR/README.txt" <<EOF
Bundle for Jino support.
Host: $HOST
Generated: $(date -Is)
Files:
- network.txt
- http_api_health.txt
- http_root_head.txt
- https_root_head.txt
- https_api_health.txt
EOF

echo "[OK] support bundle created at $OUTDIR"
ls -la "$OUTDIR"
