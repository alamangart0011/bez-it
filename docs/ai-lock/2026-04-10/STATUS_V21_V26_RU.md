# Статус V21 -> V26

## Что уже подтверждено
- GitHub login и write-access рабочие
- Lock-файлы пишутся в `alamangart0011/contour-chat-v17`
- Собран локальный snapshot-скрипт для полного съёма Mac + Jino
- Собран полный чек-лист P0/P1/P2

## Что считаю текущим реальным baseline
- repo: alamangart0011/contour-chat-v17
- VPS path: /opt/messenger/contour-chat-jino-final
- domain: ai.voice.oboron-it.ru
- цель: догнать room-based контур до V26

## Автоплан 10 задач
1. Снять полный terminal/runtime dump
2. Восстановить точную хронологию сделанных действий
3. Зафиксировать branch/commit/runtime state
4. Проверить docker/api/web/db/nginx
5. Сверить frontend/backend contract rooms/messages/auth
6. Найти schema drift по БД
7. Разложить ошибки на P0/P1/P2
8. Сгенерировать autofix-блоки
9. Собрать regression/smoke набор
10. Выдать ordered recovery plan до V26

## Прогресс до V26
- V21: в работе
- V22: не начато
- V23: не начато
- V24: не начато
- V25: не начато
- V26: не начато
