# Frontend priority 1 bridge

## Core fact

The live domain still looks incomplete because the active frontend is still centered around a monolithic `frontend/src/App.jsx`.

Priority 1 cleanup for shell, dashboard, and voice cannot be finished honestly without moving the frontend to a cleaner shared and feature structure.

## Whitepatch assets already known

Prepared shared paths from the existing whitepatch work:
- `frontend/src/shared/api/base.js`
- `frontend/src/shared/branding/defaults.js`
- `frontend/src/shared/runtime/constants.js`
- `frontend/src/shared/ui/tokens.js`
- `frontend/src/shared/lib/formatters.js`
- `frontend/src/shared/messages/grouping.js`
- `frontend/src/shared/rooms/collections.js`
- `frontend/src/shared/rooms/kinds.js`

Prepared app-entry model:
- `frontend/src/App.jsx` should become bootstrap only
- auth should move to `frontend/src/features/auth/AuthPage.jsx`
- shell should move to `frontend/src/features/shell/MainShell.jsx`

## Why the domain still lacks useful information

Because shell, dashboard, and voice still depend on the old mixed frontend runtime.

That means the runtime is alive, but the product-first information layer is not finished.

## Mandatory next code step

1. Move the first shared layer into the active contour.
2. Rewrite `frontend/src/App.jsx` into a bootstrap-only entry.
3. Extract the minimum priority 1 feature layer: auth, shell, sidebar, rooms, messages, composer, members, voice overlay.

## Expected progress after this bridge is implemented

- UI and UX polish: 46% -> 62%+
- voice and meetings runtime: 78% -> 82%+
- overall: 78% -> 84%+

## Acceptance criteria

The bridge is considered closed when:
- `frontend/src/App.jsx` is no longer a monolith;
- shell, dashboard, and voice work through the new shared and feature contour;
- the domain shows useful working information right after login.
