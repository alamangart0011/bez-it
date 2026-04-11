# Web runtime one-to-one switch map

## Цель
Дать механическую карту замены existing `rooms/calls` файлов на уже подготовленный runtime-wired слой.

## One-to-one замена

### Pages
- `apps/web/src/pages/rooms-page.ts` -> `apps/web/src/pages/rooms-page-next.ts`
- `apps/web/src/pages/calls-page.ts` -> `apps/web/src/pages/calls-page-next.ts`

### Views
- `apps/web/src/views/rooms-view.ts` -> `apps/web/src/views/rooms-view-next.ts`
- `apps/web/src/views/calls-view.ts` -> `apps/web/src/views/calls-view-next.ts`

### Adapters
- `apps/web/src/adapters/rooms-page-adapter.ts` -> `apps/web/src/adapters/rooms-page-adapter-next.ts`
- `apps/web/src/adapters/calls-page-adapter.ts` -> `apps/web/src/adapters/calls-page-adapter-next.ts`

## Runtime chain behind the switch

### Rooms
- page entry: `rooms-page-runtime-entry.ts`
- shell: `room-shell-runtime.ts`
- view: `rooms-view-runtime.ts`
- adapter: `rooms-page-adapter-runtime.ts`

### Calls
- page entry: `calls-page-runtime-entry.ts`
- shell: `call-shell-runtime.ts`
- view: `calls-view-runtime.ts`
- adapter: `calls-page-adapter-runtime.ts`

## Minimal switch strategy
1. existing file either re-export `*-next` symbol,
2. or existing file content is replaced by `*-next` content,
3. then duplicate metadata-only authority is removed in cleanup pass.

## Acceptance
Switch is complete when `rooms/calls` use the runtime-wired `next` descriptors as their main export path.
