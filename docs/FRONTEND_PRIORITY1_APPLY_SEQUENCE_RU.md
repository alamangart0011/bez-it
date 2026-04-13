# Frontend priority 1 apply sequence

## Active goal

Bring the existing frontend whitepatch into the active room-based contour in the only safe order.

## Step 1. Shared layer
Move into the active contour first:
- branding defaults
- runtime constants
- ui tokens
- formatters
- normalizers
- api base
- room collections
- message grouping
- voice helpers
- ui primitives

## Step 2. App entry
After shared is present, rewrite `frontend/src/App.jsx` into bootstrap-only entry.

`App.jsx` should keep only:
- loading state
- auth switch
- token bootstrap
- user bootstrap
- wiring of `AuthPage` and `MainShell`

## Step 3. Feature layer
After entry is rewritten, move the minimum feature layer:
- `features/auth/AuthPage.jsx`
- `features/shell/MainShell.jsx`
- `features/sidebar/Sidebar.jsx`
- `features/rooms/RoomViewport.jsx`
- `features/messages/MessageList.jsx`
- `features/composer/Composer.jsx`
- `features/members/MembersPanel.jsx`
- `features/overlay/VoiceOverlay.jsx`
- `features/command-palette/CommandPalette.jsx`
- `features/modals/ModalsRoot.jsx`

## Step 4. Cleanup
After the move:
- remove duplicate helpers from the old monolith
- remove inline tokens and primitives from `App.jsx`
- remove inline formatters and normalizers from `App.jsx`
- remove inline room and voice helpers from `App.jsx`
- remove branding drift and service tails

## Acceptance criteria

Priority 1 frontend is considered closed when:
- `App.jsx` is no longer a monolith
- shared files are used by the feature layer
- shell, dashboard, and voice can be cleaned on top of the new contour
- the live domain shows useful working information after login

## Expected progress after execution
- UI and UX polish: `46% -> 62%+`
- voice and meetings runtime: `78% -> 82%+`
- overall: `78% -> 84%+`
