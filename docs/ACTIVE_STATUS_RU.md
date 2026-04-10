# Текущий активный статус проекта

## Канон
- active baseline: room-based V17
- active repo: contour-chat-v17
- active deploy path: /opt/messenger/contour-chat-jino-final
- active domain: https://ai.voice.oboron-it.ru

## Что считать уже зафиксированным
- один baseline
- один deploy path
- один shell
- единый admin center
- GitHub является главным источником истины

## Что уже должно быть в проекте
- text rooms
- voice rooms
- meeting rooms
- auth + sessions + invites
- profiles + settings
- roles + permissions
- admin center
- audit
- deploy scripts
- SQL migration layer

## Что новый чат должен проверить первым делом
- реальный active shell entry
- актуальный auth flow
- rooms runtime
- voice runtime
- admin runtime
- SQL parity с текущим кодом
- состояние deploy scripts

## Что не делать
- не возвращать messenger-first как active UI
- не начинать новый анализ с нуля
- не считать старые архивы равноправными GitHub
- не плодить новые параллельные активные ветки
