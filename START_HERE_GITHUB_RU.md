# Старт проекта из GitHub

Если новый чат должен поднять проект только из GitHub, начинать отсюда.

## Активный репозиторий
`alamangart0011/bez-it`

## Активный канон
- room-based V17 baseline
- один baseline
- один deploy path
- один shell
- один admin center

## Не считать активным
- messenger-first
- старые архивы как главный источник
- старые экспериментальные ветки

## Минимальный порядок чтения
1. `START_HERE_GITHUB_RU.md`
2. `docs/CHATGPT_SOURCE_OF_TRUTH_RU.md`
3. `docs/NEW_CHAT_GITHUB_BOOTSTRAP_RU.txt`
4. `docs/PROJECT_MANIFEST_RU.json`
5. `docs/ACTIVE_STATUS_RU.md`
6. `docs/BACKLOG_P0_P1_P2_RU.md`
7. `README.md`
8. `docker-compose.yml`
9. `deploy/`
10. `infra/sql/`
11. `backend/src/`
12. `frontend/src/`

## Что должен сделать новый чат сначала
- зафиксировать active baseline
- кратко описать текущее состояние по коду
- выделить P0 стопперы
- только потом предлагать и вносить изменения

## Жёсткое правило
Если есть конфликт между старым архивом и актуальным GitHub, главным считать GitHub.
