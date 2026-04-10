# Auth parity status and plan

## Уже есть в active backend
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/logout-all
- GET /api/auth/sessions
- DELETE /api/auth/sessions/:sessionId
- POST /api/auth/change-password
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/invite/:token
- POST /api/auth/accept-invite
- admin invitations create/list
- admin sessions list/revoke

## Уже есть в service layer
- session lifecycle
- refresh rotation
- revoke current/other sessions
- invitation accept with auto-login
- password reset flow

## Нет в active backend, но есть legacy reference
- phone OTP login
- QR login
- trusted devices style flows around phone bind

## Что делать следующим пакетом
1. frontend invite acceptance page against /api/auth/invite/:token and /api/auth/accept-invite
2. frontend sessions/devices page against /api/auth/sessions and revoke session
3. enrich sessions view as trusted devices approximation using userAgent/ip/current flags
4. only after that: extract phone OTP endpoints from legacy reference into active backend
5. then: QR auth parity

## Решение
- phone/QR не отключать концептуально
- invite/session flow довести первым, потому что backend уже готов
- phone OTP и QR переводить из legacy reference в active code вторым пакетом
