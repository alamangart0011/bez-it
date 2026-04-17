# Snapshot analysis — 2026-04-10

## Runtime
- VPS path: /opt/messenger/contour-chat-jino-final
- host: 81.177.141.214
- Ubuntu 22.04.5
- nginx :80 -> docker web :8080
- docker compose services healthy: api, db, web
- releaseVersion: 17.17.0
- releaseChannel: operator-wallboard
- appName: Signalum

## Git
- repo: alamangart0011/bez-it
- HEAD branch on VPS: ops/fix-ui-contract-20260410_002744
- worktree clean
- main behind origin/main by 2 commits

## API
- /api/health = 200
- /api/release = 200
- /api/auth/login = 200 for admin@corpchat.local
- contract fixes already present for:
  - PATCH /api/rooms/:roomId
  - GET /api/rooms/:roomId/members
  - POST /api/rooms/:roomId/members
  - DELETE /api/rooms/:roomId/members/:userId
  - POST /api/rooms/:roomId/join
- validators already accept text/content compatibility

## Database
- critical room-based tables present: rooms, room_members, voice_participants, meetings, meeting_events, user_profiles, departments, invitations, system_settings, room_incidents, auth_sessions
- messages still has dual model residue: both chat_id and room_id
- chats/chat_members/calls tables still present from parallel model

## Risks
- parallel data model residue (room-based + chat-based)
- unauthorized polling to /api/voice/rooms/:id/state from external client
- frontend still appears to be single-file App.jsx legacy shell in snapshot
- phone OTP UI mismatch likely still unresolved unless hidden in current UI build

## Immediate path to V26
1. freeze room-based model as canonical
2. add room-scoped delete/pin aliases if frontend still calls them
3. hard-disable or implement phone OTP
4. split legacy messenger-first residue from active baseline
5. move from V21 contract stabilization to V22 UX hardening
