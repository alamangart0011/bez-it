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
- server.js wiring for runtime dispatch
- live runtime payload for /api/rooms
- live runtime payload for /api/calls
- web runtime page plan builder
- web runtime hydrate client
- page runtime adapter with runtime plans

## Ключевые файлы для входа
- apps/api/server.js
- apps/api/src/runtime/route-dispatch.js
- apps/api/src/runtime/handler-map.js
- apps/api/src/runtime/server-runtime.js
- apps/api/src/runtime/runtime-response.js
- apps/api/src/runtime/server-dispatch.js
- apps/api/src/handlers/rooms-handler.js
- apps/api/src/handlers/calls-handler.js
- apps/web/src/runtime/runtime-page-plan.ts
- apps/web/src/runtime/runtime-http-client.ts
- apps/web/src/runtime/page-runtime-adapter.ts
- docs/FOUNDATION_STATUS_RU.md
- docs/NEXT_BATTLE_PACKAGE_RU.md

## Текущий статус
- основной план из 18 этапов завершен
- server runtime уже подключен и живет в PR
- rooms/calls runtime уже выдают live payload
- web runtime уже умеет строить page plan и hydrate path
- PR открыт и используется как единая точка поставки foundation + runtime слоя

## Следующий обязательный шаг
Довести первый реальный web execution path для rooms и calls, затем привязать transcript/assistant panels к hydrated runtime payload.

## После этого сделать
1. first real rooms page execution path
2. first real calls page execution path
3. bind transcript and assistant panels to hydrated runtime
4. cleanup and merge-ready pass

## Правило продолжения
Новый чат должен:
- сначала вытащить состояние из GitHub по repo/branch/PR
- открыть этот файл и FOUNDATION_STATUS_RU.md
- не пересобирать foundation заново
- не возвращаться к уже закрытым server/runtime шагам
- продолжать с web execution path и final cleanup

## Готовый стартовый запрос для нового чата
Открой репозиторий alamangart0011/contour-chat-v17, ветку project/signalum-voice-foundation-20260410 и PR #13. Сначала прочитай docs/NEW_CHAT_CONTINUATION_RU.md, docs/FOUNDATION_STATUS_RU.md и runtime-файлы apps/api + apps/web. После этого сразу продолжай с первого реального web execution path для rooms и calls, затем доведи transcript/assistant binding и cleanup без возврата к уже закрытым этапам.
