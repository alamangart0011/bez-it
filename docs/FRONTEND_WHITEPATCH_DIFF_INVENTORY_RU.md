# Frontend whitepatch diff inventory

## Status

Active contour `ops/single-contour-cleanup-20260413` and whitepatch branch `chat2-frontend-cleanup` are diverged.

For frontend whitepatch, the exact missing delta on the whitepatch side is 20 files.

## Missing docs from whitepatch side
- `docs/CHAT3_STATUS_RU.md`
- `docs/FRONTEND_WHITEPATCH_APPLY_ORDER_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_APP_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART1_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART2_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART3_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_SHARED_RU.md`
- `docs/FRONTEND_WHITEPATCH_GAP_REGISTER_RU.md`
- `docs/FRONTEND_WHITEPATCH_MATRIX_RU.md`
- `docs/FRONTEND_WHITEPATCH_RU.md`

## Missing shared files from whitepatch side
- `frontend/src/shared/api/base.js`
- `frontend/src/shared/branding/defaults.js`
- `frontend/src/shared/lib/formatters.js`
- `frontend/src/shared/lib/stringUtils.js`
- `frontend/src/shared/lib/testExport.js`
- `frontend/src/shared/messages/grouping.js`
- `frontend/src/shared/rooms/collections.js`
- `frontend/src/shared/rooms/kinds.js`
- `frontend/src/shared/runtime/constants.js`
- `frontend/src/shared/ui/tokens.js`

## What this means

The active contour still does not contain the exact frontend shared starter layer prepared in the whitepatch work.

That is the direct technical reason why the domain can have a live runtime but still lack a finished product-first information layer.

## Next move

1. Port the missing shared files into the active contour.
2. Rewrite `frontend/src/App.jsx` into bootstrap-only entry.
3. Move the minimum feature layer.
4. Clean old inline monolith helpers.

## Expected progress after port
- UI and UX polish: `46% -> 62%+`
- voice and meetings runtime: `78% -> 82%+`
- overall: `78% -> 84%+`
