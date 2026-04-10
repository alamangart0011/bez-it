# Карта репозитория

## Корень
- `CHATGPT_START_HERE_RU.md` — старт для нового чата
- `README.md` — общий вход в проект
- `docker-compose.yml` — инфраструктурная точка входа

## Документы
- `docs/PROJECT_BOOT_MANIFEST_RU.json` — машинный манифест проекта
- `docs/ONE_PROMPT_ANY_CHAT_RU.txt` — универсальный prompt для нового чата
- `docs/LATEST_STATE_RU.md` — последнее активное состояние
- `docs/FOLDER_NAMING_CONVENTIONS_RU.md` — naming rules
- `docs/DECISION_RULES_RU.md` — правила решений

## Инфраструктура
- `deploy/` — deploy, smoke, post-check, maintenance
- `infra/sql/` — SQL parity и миграции

## Backend
- `backend/src/routes/` — HTTP entrypoints
- `backend/src/services/` — бизнес-логика
- `backend/src/repositories/` — слой доступа к БД
- `backend/src/middleware/` — auth/guards/errors
- `backend/src/lib/` — shared runtime helpers

## Frontend
- `frontend/src/` — основной UI-контур
- сначала читать shell/auth entry, потом rooms/voice/meeting/admin

## Жёсткий приоритет чтения
GitHub -> deploy/sql -> backend -> frontend -> старые архивы только как reference.
