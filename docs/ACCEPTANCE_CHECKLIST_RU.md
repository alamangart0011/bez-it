# Acceptance checklist V10

Auth:
- POST /api/auth/login возвращает accessToken и refreshToken
- POST /api/auth/refresh обновляет accessToken
- GET /api/me без token -> 401
- GET /api/me с token -> 200

Data:
- GET /api/rooms возвращает комнаты из PostgreSQL
- GET /api/rooms/:roomId/messages возвращает сообщения из PostgreSQL
- POST /api/rooms/:roomId/messages создаёт сообщение в PostgreSQL

Infra:
- docker compose build проходит
- db/api/web стартуют
- scripts/smoke_api.sh проходит без ошибки

Russia-only:
- APP_COUNTRY_MODE=RUSSIA_ONLY
- core runtime не зависит от внешних SaaS
