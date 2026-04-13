#!/usr/bin/env bash
set -euo pipefail
SOURCE="${1:-HEAD}"
TARGET="${2:-ops/single-contour-cleanup-20260413}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
git checkout "$SOURCE" -- \
  docs/continuity/README.md \
  docs/continuity/CONTINUATION_STATUS_RU.md \
  docs/continuity/CONFIG_LEDGER_RU.md \
  docs/continuity/PROGRESS_LEDGER_RU.md \
  docs/continuity/PRIORITY_RU.md \
  docs/runbook/DEPLOY_FASTPATH_RU.md \
  docs/runbook/BROWSER_ACCEPTANCE_RU.md \
  docs/runbook/ROLLBACK_FASTPATH_RU.md \
  docs/hardening/RELEASE_HARDENING_RU.md \
  bin/docs_fast_push.sh \
  bin/docs_fast_merge.sh \
  bin/destructive_apply_guard.sh
git add \
  docs/continuity/README.md \
  docs/continuity/CONTINUATION_STATUS_RU.md \
  docs/continuity/CONFIG_LEDGER_RU.md \
  docs/continuity/PROGRESS_LEDGER_RU.md \
  docs/continuity/PRIORITY_RU.md \
  docs/runbook/DEPLOY_FASTPATH_RU.md \
  docs/runbook/BROWSER_ACCEPTANCE_RU.md \
  docs/runbook/ROLLBACK_FASTPATH_RU.md \
  docs/hardening/RELEASE_HARDENING_RU.md \
  bin/docs_fast_push.sh \
  bin/docs_fast_merge.sh \
  bin/destructive_apply_guard.sh
git diff --cached --quiet && { echo "NO_DOC_MERGE_CHANGES"; exit 0; }
git commit -m "docs(runbook): merge docs layer from $SOURCE"
git push origin "HEAD:refs/heads/$TARGET" || true
echo "DOCS_MERGE_OK"
