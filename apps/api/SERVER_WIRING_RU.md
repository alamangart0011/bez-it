# Server wiring blueprint

## Базовые точки
- /health
- /api/meta

## Доменные группы
- /api/rooms
- /api/calls
- /api/memberships
- /api/presence
- /api/transcripts
- /api/assistant
- /api/knowledge
- /api/actions

## Следующий шаг
Перевести route map в runtime handlers и затем подключить web shell к этим доменам.
