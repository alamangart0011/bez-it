# Frontend priority 1 merge queue

## Purpose

Move the existing frontend whitepatch into the active room-based contour in the smallest safe chunks.

## Queue A — shared first
- `frontend/src/shared/api/base.js`
- `frontend/src/shared/branding/defaults.js`
- `frontend/src/shared/runtime/constants.js`
- `frontend/src/shared/ui/tokens.js`
- `frontend/src/shared/lib/formatters.js`
- `frontend/src/shared/lib/normalizers.js`
- `frontend/src/shared/messages/grouping.js`
- `frontend/src/shared/rooms/collections.js`
- `frontend/src/shared/rooms/kinds.js`
- `frontend/src/shared/voice/helpers.js`

## Queue B — entry rewrite
- rewrite `frontend/src/App.jsx`
- keep only bootstrap logic
- connect `AuthPage`
- connect `MainShell`

## Queue C — minimum feature layer
- `features/auth/AuthPage.jsx`
- `features/shell/MainShell.jsx`
- `features/sidebar/Sidebar.jsx`
- `features/rooms/RoomViewport.jsx`
- `features/messages/MessageList.jsx`
- `features/composer/Composer.jsx`
- `features/members/MembersPanel.jsx`
- `features/overlay/VoiceOverlay.jsx`

## Queue D — cleanup
- remove old inline helpers from `App.jsx`
- remove inline tokens and branding tails
- remove duplicate room and voice helpers
- remove service and debug copy from user flow

## Acceptance target
- after queues A+B+C+D the live domain should show useful working information right after login
- expected progress: overall `78% -> 84%+`
