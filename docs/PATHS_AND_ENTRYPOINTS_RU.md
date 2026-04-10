# Пути и точки входа

## Активный deploy path
`/opt/messenger/contour-chat-jino-final`

## Активный домен
`https://ai.voice.oboron-it.ru`

## Главные точки входа в репозитории

### Корень
- `CHATGPT_START_HERE_RU.md` — старт для нового чата
- `README.md` — общий вход в проект
- `docker-compose.yml` — инфраструктурный вход

### Deploy
- `deploy/` — выкладка, smoke, post-check, maintenance
- `infra/sql/` — SQL parity, migrations, baseline schema fixes

### Backend
- `backend/src/routes/` — HTTP/API entrypoints
- `backend/src/services/` — бизнес-логика
- `backend/src/repositories/` — слой БД
- `backend/src/middleware/` — auth/guards/errors
- `backend/src/lib/` — shared helpers

### Frontend
- `frontend/src/` — активный UI-контур
- сначала читать shell/auth entry, потом rooms/voice/meeting/admin

## Что новый чат должен определить первым делом
- где shell entry
- где auth entry
- где rooms entry
- где voice entry
- где meeting entry
- где admin entry
- какие SQL-файлы обязательны для parity
- какие deploy-скрипты обязательны для запуска
