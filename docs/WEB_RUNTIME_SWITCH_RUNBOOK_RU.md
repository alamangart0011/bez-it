# Web runtime switch runbook

## Цель
Переключить existing `rooms/calls` entrypoints на runtime-wired path без возврата к foundation и без ломки текущего live contour.

## Что уже подготовлено в ветке

### Runtime core
- `page-runtime-adapter.ts`
- `runtime-execution-index.ts`
- `rooms/calls/transcript/assistant` execution modules
- `rooms-call-runtime.ts`

### Runtime bridges
- `rooms-page-runtime-entry.ts`
- `calls-page-runtime-entry.ts`
- `right-panel-runtime-sections.ts`
- `room-shell-runtime.ts`
- `call-shell-runtime.ts`
- `rooms-view-runtime.ts`
- `calls-view-runtime.ts`
- `rooms-page-adapter-runtime.ts`
- `calls-page-adapter-runtime.ts`
- `runtime-page-entry-index.ts`
- `runtime-view-entry-index.ts`
- `runtime-adapter-entry-index.ts`
- `runtime-wired-pages.ts`
- `runtime-wired-views.ts`
- `runtime-wired-adapters.ts`
- `runtime-ui-entry.ts`

### Next descriptors
- `pages/rooms-page-next.ts`
- `pages/calls-page-next.ts`
- `views/rooms-view-next.ts`
- `views/calls-view-next.ts`
- `adapters/rooms-page-adapter-next.ts`
- `adapters/calls-page-adapter-next.ts`

## Реальный switch-пакет

### Шаг 1. Pages
Заменить текущие entrypoints:
- `rooms-page.ts` -> runtime-wired rooms page
- `calls-page.ts` -> runtime-wired calls page

Практически:
- либо заменить содержимое на `*-next` вариант,
- либо переэкспортировать `roomsPageNext` / `callsPageNext` как основной export.

### Шаг 2. Views
Переключить:
- `rooms-view.ts` -> `roomsViewNext`
- `calls-view.ts` -> `callsViewNext`

### Шаг 3. Adapters
Переключить:
- `rooms-page-adapter.ts` -> `roomsPageAdapterNext`
- `calls-page-adapter.ts` -> `callsPageAdapterNext`

### Шаг 4. Validate runtime chain
Проверить, что фактический path теперь такой:
- rooms -> `loadRoomsPageRuntime`
- calls -> `loadCallsPageRuntime`
- right panel -> runtime transcript / assistant sections

### Шаг 5. Cleanup
После успешного switch:
- убрать дубли metadata-only path;
- не держать parallel descriptor path, если он больше не нужен;
- оставить старые файлы только если они нужны как compatibility-layer.

## Acceptance
Switch считается закрытым, когда:
- `rooms` и `calls` entrypoints реально указывают на runtime-wired path;
- transcript и assistant не висят пустыми секциями;
- shell и right panel питаются от runtime payload;
- старый metadata-only path больше не является основным.
