# GitHub как источник истины для проекта

## Активный репозиторий
`alamangart0011/bez-it`

## Активный продуктовый канон
- room-based V17 baseline
- один baseline
- один deploy path
- один shell
- один admin center
- messenger-first не является активным каноном

## Порядок доверия к источникам
1. Код и документы внутри этого GitHub-репозитория
2. SQL и deploy-скрипты внутри этого же репозитория
3. Handoff/архивы только как reference
4. Старые чаты только если информации нет в GitHub

## Откуда читать проект в первую очередь
### 1. Документы
- `docs/NEW_CHAT_GITHUB_BOOTSTRAP_RU.txt`
- `docs/CHATGPT_SOURCE_OF_TRUTH_RU.md`
- `README.md`
- остальные `docs/*`

### 2. Инфраструктура и выкладка
- `docker-compose.yml`
- `deploy/*`
- `infra/sql/*`

### 3. Backend
- `backend/src/routes/*`
- `backend/src/services/*`
- `backend/src/repositories/*`
- `backend/src/middleware/*`
- `backend/src/lib/*`

### 4. Frontend
- `frontend/src/*`
- сначала shell-entry и auth-entry, потом rooms/voice/meeting/admin

## Что должен делать новый чат
- сначала читать GitHub, а не старые сообщения
- сначала фиксировать статус по репозиторию
- все новые решения собирать только в этот репозиторий
- не переключать активный канон на messenger-first
- не плодить параллельные релизные ветки

## Что считать reference-only
- старые архивы
- старые handoff-пакеты
- старые экспериментальные ветки
- messenger-first пакеты и их материалы

## Цель
Новый чат должен поднимать весь проект из GitHub как из диска:
- код
- deploy
- SQL
- документы
- тексты
- принятые решения

Если есть конфликт между старым архивом и актуальным GitHub, главным считать GitHub.
