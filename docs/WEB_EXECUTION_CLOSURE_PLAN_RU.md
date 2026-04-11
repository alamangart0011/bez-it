# Web execution closure plan

## Каноника
- repo: `alamangart0011/contour-chat-v17`
- branch: `project/signalum-voice-foundation-20260410`
- pr: `#13`

## Что уже реально собрано в head

### API
- `apps/api/server.js` уже держит `/health`, `/api/health`, `/api/live`, `/api/ready`, `/api/release`, `/api/meta` как отдельные точки.
- Остальные `'/api/*'` уже идут через `server-dispatch`.
- `rooms` и `calls` runtime уже отдают live payload.

### Web runtime
- `pageRuntimeAdapter.execute()` уже есть.
- `runtimeExecutionIndex` уже связывает `rooms`, `calls`, `transcript`, `assistant`.
- `rooms-runtime-execution.ts`, `calls-runtime-execution.ts`, `transcript-runtime-execution.ts`, `assistant-runtime-execution.ts` уже лежат в ветке.
- `rooms-call-runtime.ts` уже умеет выполнять chained flow: `rooms -> calls -> transcript -> assistant`.

## Что это меняет
Старые continuation-docs правильно описывают направление, но уже отстают от фактического head.

Реальный следующий шаг уже не в том, чтобы только создать execution-модули.

Реальный следующий пакет такой:
1. довести web entrypoints до использования `pageRuntimeAdapter.execute()`;
2. посадить `rooms` и `calls` pages на execution-path как основной путь;
3. привязать transcript и assistant panels к hydrated runtime payload внутри calls/rooms-call flow;
4. убрать дубли старого hydrate-only path;
5. провести cleanup и merge review;
6. затем собрать deployable preview contour для `apps/web`.

## Незакрытые контуры

### Контур 1. Product web binding
Нужно проверить и закрыть:
- `apps/web/src/pages/rooms-page.ts`
- `apps/web/src/pages/calls-page.ts`
- `apps/web/src/views/rooms-view.ts`
- `apps/web/src/views/calls-view.ts`
- `apps/web/src/adapters/rooms-page-adapter.ts`
- `apps/web/src/adapters/calls-page-adapter.ts`
- `apps/web/src/loaders/rooms-loader.ts`
- `apps/web/src/loaders/calls-loader.ts`
- `apps/web/src/flow/rooms-call-flow.ts`
- `apps/web/src/flow/rooms-call-runtime.ts`
- реальные entrypoints shell/content/right panel, где state должен прийти из runtime execute, а не только из декларативных связок.

### Контур 2. Preview deploy
После product binding:
- сделать deployable `apps/web` preview contour;
- собрать `compose/up/down/smoke`;
- вывести preview на `/runtime-preview` без ломки текущего live contour;
- прогнать visual smoke для `rooms -> calls -> transcript -> assistant`;
- подготовить root cutover plan только после стабильного preview.

## Порядок закрытия
1. rooms web execution path
2. calls web execution path
3. transcript panel runtime binding
4. assistant panel runtime binding
5. duplicate path cleanup
6. merge review pass
7. deployable web preview contour
8. runtime-preview smoke
9. root cutover plan

## Критерий готовности
Пакет считается закрытым, когда:
- rooms page реально живет на runtime execution path;
- calls page реально живет на runtime execution path;
- transcript и assistant получают hydrated runtime payload в реальном UI-потоке;
- cleanup pass завершен;
- `apps/web` preview собирается отдельным контуром;
- preview доступен по `/runtime-preview`;
- визуальный smoke проходит без возврата к старому root.
