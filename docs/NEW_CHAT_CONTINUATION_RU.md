# Продолжение работы в новом чате

## Репозиторий
- repo: alamangart0011/contour-chat-v17
- branch: project/signalum-voice-foundation-20260410
- pr: #13

## Что уже собрано
- monorepo foundation
- apps/api skeleton
- apps/web skeleton
- domain docs
- bindings
- state contracts
- adapters
- loaders
- handlers
- route map
- app flow
- shell layer
- runtime views
- runtime dispatch layer
- merge-ready и cleanup docs

## Ключевые файлы для входа
- apps/api/server.js
- apps/api/src/runtime/route-dispatch.js
- apps/api/src/runtime/handler-map.js
- apps/api/src/runtime/server-runtime.js
- apps/api/src/runtime/runtime-response.js
- apps/api/src/runtime/server-dispatch.js
- apps/web/src/runtime/app-runtime-index.ts
- apps/web/src/runtime/page-runtime-adapter.ts
- docs/FOUNDATION_STATUS_RU.md
- docs/NEXT_BATTLE_PACKAGE_RU.md

## Текущий статус
- основной план из 18 этапов завершен
- идет следующий боевой пакет реализации
- PR открыт и используется как единая точка поставки foundation + runtime слоя

## Следующий обязательный шаг
Подключить runtime-dispatch в apps/api/server.js так, чтобы:
1. /health оставался как есть
2. /api/meta оставался как есть
3. остальные /api/* шли через server-dispatch

## После этого сделать
1. первый живой runtime-ответ для /api/rooms
2. затем первый живой runtime-ответ для /api/calls
3. затем проверить flow rooms -> calls -> transcript -> assistant
4. затем чистка и merge-ready pass

## Правило продолжения
Новый чат должен:
- сначала вытащить состояние из GitHub по repo/branch/PR
- открыть этот файл и FOUNDATION_STATUS_RU.md
- не пересобирать foundation заново
- продолжать с server.js wiring и runtime flow

## Готовый стартовый запрос для нового чата
Открой репозиторий alamangart0011/contour-chat-v17, ветку project/signalum-voice-foundation-20260410 и PR #13. Сначала прочитай docs/NEW_CHAT_CONTINUATION_RU.md, docs/FOUNDATION_STATUS_RU.md и ключевые runtime-файлы. После этого сразу продолжай работу со следующего обязательного шага: подключи runtime-dispatch в apps/api/server.js, затем сделай первый живой runtime-ответ для /api/rooms и продолжай дальше без возврата к уже закрытым этапам.
