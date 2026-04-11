# Server wiring blueprint

## Базовые точки
- /health
- /api/meta

## Доменные группы
- /api/rooms
- /api/calls
- /api/profile
- /api/memberships
- /api/transcripts
- /api/assistant
- /api/admin
- /api/actions

## Текущее состояние
- /health остается отдельной точкой
- /api/meta остается отдельной точкой
- остальные живые runtime домены проходят через server-dispatch
- rooms, calls, memberships, transcripts, assistant и actions уже подключены к handler-map

## Следующий шаг
Довести merge-ready cleanup и финальный review по web execution path.
