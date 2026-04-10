# Правила именования папок и файлов

## Главный принцип
Имена папок и файлов должны поддерживать один active baseline: `room-based-v17`.

## Корень репозитория
- корневые bootstrap-файлы держать короткими и явными;
- для стартовых документов использовать верхний регистр и понятные имена;
- не плодить новые `START_HERE*`, если можно расширить уже существующий bootstrap-слой.

## Документы
- все новые документы класть только в `docs/`;
- для русских служебных документов использовать суффикс `_RU`;
- документы по этапам и состоянию именовать так, чтобы по имени было ясно: это `stage`, `state`, `plan`, `runbook`, `checklist`, `decision`, `manifest`.

Примеры:
- `STAGE0_RELEASE_DISCIPLINE_RU.md`
- `LATEST_STATE_RU.md`
- `PROJECT_BOOT_MANIFEST_RU.json`
- `GO_LIVE_CHECKLIST_RU.md`

## Deploy и инфраструктура
- deploy-скрипты держать только в `deploy/`;
- SQL-слой держать только в `infra/sql/`;
- не разносить active baseline по вложенным каталогам вроде `v14/`, `v15/`, `release/`, `releases/` внутри production-root.

## Backend
- runtime entrypoint: `backend/src/server.js`;
- каталоги внутри `backend/src/` называть по ответственности: `routes`, `services`, `repositories`, `middleware`, `lib`, `validators`, `socket`, `db`, `config`;
- новые файлы именовать по домену и роли: `rooms.repository.js`, `admin.service.js`, `auth.js`, `permissions.js`.

## Frontend
- текущий runtime entrypoint: `frontend/src/main.jsx` -> `frontend/src/App.jsx`;
- пока active UI собран монолитно в `App.jsx`, не создавать рядом новые параллельные active entrypoints;
- когда начнётся modularization cleanup, выносить код в именованные слои: `shell/`, `features/`, `views/`, `api/`, `shared/`, но только как продолжение текущего baseline, а не как второй frontend.

## Запрещено
- возвращать `messenger-first` как active naming-модель;
- плодить новые параллельные активные ветки по именованию каталогов;
- делать пустые папки и декоративные файлы без реального runtime-назначения;
- считать архивы и временные пакеты равноправными GitHub.

## Правило для новых изменений
Если новый файл нельзя однозначно отнести к `docs/`, `deploy/`, `infra/sql/`, `backend/src/` или `frontend/src/`, сначала проверить, не дублирует ли он уже существующий active baseline.
