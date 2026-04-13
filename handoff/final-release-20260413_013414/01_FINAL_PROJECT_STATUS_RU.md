# Финальный статус проекта

## Канонический продуктовый курс
Активный продуктовый канон: room-based V17 baseline.
Messenger-first/V25 считать legacy/reference, не active path.

## Канонический live baseline
- Домен: `https://ai.voice.oboron-it.ru`
- Root сервера: `/opt/messenger/contour-chat-jino-final`
- Сервер: Jino VPS
- Активный пользователь для SSH/операций: `deploy` + `sudo`

## Что уже реально подтверждено
- SSH как `deploy` работает.
- Сервер живой.
- Контейнеры `api`, `db`, `runtime_api`, `web` подняты и healthy.
- `GET /api/health` отвечает 200.
- `GET /api/release` отвечает 200.
- На сервере релиз:
  - `releaseVersion = 17.17.0`
  - `releaseChannel = operator-wallboard`
  - `appName = Контур Связи`

## Что это значит
Инфраструктурный уровень больше не является главным стоппером.
Главные незакрытые зоны:
1. GitHub workflow-governance
2. main/live parity
3. окончательная release discipline
4. финальная прикладная acceptance по voice/meeting