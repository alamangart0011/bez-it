#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
BRANCH="${1:-ops/single-contour-cleanup-20260413}"
MSG="${2:-docs(runbook): continuity cleanup and hardening}"
ART_ROOT="$ROOT/.ops_artifacts"
STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ART_ROOT"
cd "$ROOT"
FILES=(
  docs/continuity/README.md
  docs/continuity/CONTINUATION_STATUS_RU.md
  docs/continuity/CONFIG_LEDGER_RU.md
  docs/continuity/PROGRESS_LEDGER_RU.md
  docs/continuity/PRIORITY_RU.md
  docs/runbook/DEPLOY_FASTPATH_RU.md
  docs/runbook/BROWSER_ACCEPTANCE_RU.md
  docs/runbook/ROLLBACK_FASTPATH_RU.md
  docs/hardening/RELEASE_HARDENING_RU.md
  bin/docs_fast_push.sh
  bin/docs_fast_merge.sh
  bin/destructive_apply_guard.sh
)
git add "${FILES[@]}"
git diff --cached --quiet && { echo "NO_DOC_CHANGES"; exit 0; }
git commit -m "$MSG" || true
if git push -u origin "HEAD:refs/heads/$BRANCH"; then
  echo "DOCS_PUSH_OK"
  exit 0
fi
ART="$ART_ROOT/docs_fast_push_$STAMP"
mkdir -p "$ART"
git status --short > "$ART/git_status.txt" || true
git rev-parse HEAD > "$ART/head_sha.txt" || true
git format-patch -1 HEAD --stdout > "$ART/last_commit.patch" || true
tar -czf "$ART_ROOT/docs_fast_push_$STAMP.tar.gz" -C "$ART" .
echo "DOCS_PUSH_FALLBACK=$ART_ROOT/docs_fast_push_$STAMP.tar.gz"
