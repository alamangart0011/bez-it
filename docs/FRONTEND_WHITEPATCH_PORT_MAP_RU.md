# Frontend whitepatch port map

## Source branch
- `chat2-frontend-cleanup`
- PR: `#10`

## Files already prepared there

### Docs
- `docs/FRONTEND_WHITEPATCH_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_APP_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_SHARED_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART1_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART2_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART3_RU.md`
- `docs/FRONTEND_WHITEPATCH_APPLY_ORDER_RU.md`
- `docs/FRONTEND_WHITEPATCH_MATRIX_RU.md`
- `docs/FRONTEND_WHITEPATCH_GAP_REGISTER_RU.md`

### Shared files
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

## What must be ported first into the active contour

### Step 1
Shared layer minimum:
- `frontend/src/shared/api/base.js`
- `frontend/src/shared/branding/defaults.js`
- `frontend/src/shared/runtime/constants.js`
- `frontend/src/shared/ui/tokens.js`
- `frontend/src/shared/lib/formatters.js`
- `frontend/src/shared/messages/grouping.js`
- `frontend/src/shared/rooms/collections.js`
- `frontend/src/shared/rooms/kinds.js`

### Step 2
App entry rewrite:
- bootstrap-only `frontend/src/App.jsx`
- split to `features/auth/AuthPage.jsx`
- split to `features/shell/MainShell.jsx`

### Step 3
Priority 1 feature layer:
- sidebar
- rooms
- messages
- composer
- members
- voice overlay

## Why this matters

Without porting this whitepatch into the active contour, the live domain keeps a working runtime but not a finished product-first shell/dashboard/voice layer.

## Expected progress after port + priority 1 closure
- UI and UX polish: `46% -> 62%+`
- voice and meetings runtime: `78% -> 82%+`
- overall: `78% -> 84%+`
