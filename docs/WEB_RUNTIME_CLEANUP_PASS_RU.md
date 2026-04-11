# Web runtime cleanup pass

## Цель
После переключения existing `rooms/calls` entrypoints на runtime-wired path убрать дубли старого metadata-only контура и оставить один основной runtime flow.

## Что считать legacy после switch
После успешного switch legacy-считается всё, что остается только схемным описанием и больше не используется как основной path.

В первую очередь проверить:
- `apps/web/src/pages/rooms-page.ts`
- `apps/web/src/pages/calls-page.ts`
- `apps/web/src/views/rooms-view.ts`
- `apps/web/src/views/calls-view.ts`
- `apps/web/src/adapters/rooms-page-adapter.ts`
- `apps/web/src/adapters/calls-page-adapter.ts`
- `apps/web/src/loaders/rooms-loader.ts`
- `apps/web/src/loaders/calls-loader.ts`
- `apps/web/src/flow/rooms-call-flow.ts`
- `apps/web/src/config/right-panels.ts`
- `apps/web/src/config/navigation.ts`

## Cleanup rules

### 1. One main path
Для `rooms` и `calls` должен остаться один основной путь:
- runtime execution
- runtime page entry
- runtime view/adapter bridge
- shell runtime composition

### 2. No duplicate metadata-only authority
Нельзя оставлять ситуацию, где:
- runtime path уже основной,
- но `pages/views/adapters/loaders` по-прежнему считаются каноническим источником данных.

### 3. Transcript and assistant must stay live
Нельзя удалять или размывать path для:
- transcript runtime panel
- assistant runtime panel

Они должны остаться живыми секциями правой панели.

### 4. Keep compatibility only if explicit
Если старые descriptor-файлы нужны только как compatibility-layer, это должно быть явно отмечено.

## Практический cleanup-порядок
1. переключить existing exports/imports на runtime-wired `*-next` или runtime bridge path;
2. проверить, какие loader/adapter/page descriptors перестали реально использоваться;
3. убрать дубли старого metadata-only path;
4. не трогать foundation/runtime core;
5. после cleanup перейти к `/runtime-preview` visual smoke.

## Acceptance
Cleanup считается завершенным, когда:
- для `rooms/calls` нет двух параллельных основных путей;
- transcript и assistant остаются runtime-backed;
- shell/right-panel получают state только из runtime path;
- preview можно поднимать без возвращения к старой descriptor-only логике.
