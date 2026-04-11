# Web runtime switch snippets

## Цель
Дать точные минимальные replacement-snippets для existing `rooms/calls` files.

## 1. `apps/web/src/pages/rooms-page.ts`
Заменить содержимое на:

```ts
export { roomsPageNext as roomsPage } from './rooms-page-next';
```

## 2. `apps/web/src/pages/calls-page.ts`
Заменить содержимое на:

```ts
export { callsPageNext as callsPage } from './calls-page-next';
```

## 3. `apps/web/src/views/rooms-view.ts`
Заменить содержимое на:

```ts
export { roomsViewNext as roomsView } from './rooms-view-next';
```

## 4. `apps/web/src/views/calls-view.ts`
Заменить содержимое на:

```ts
export { callsViewNext as callsView } from './calls-view-next';
```

## 5. `apps/web/src/adapters/rooms-page-adapter.ts`
Заменить содержимое на:

```ts
export { roomsPageAdapterNext as roomsPageAdapter } from './rooms-page-adapter-next';
```

## 6. `apps/web/src/adapters/calls-page-adapter.ts`
Заменить содержимое на:

```ts
export { callsPageAdapterNext as callsPageAdapter } from './calls-page-adapter-next';
```

## После замены
1. прогнать import-resolution;
2. проверить runtime chain для `rooms/calls`;
3. прогнать cleanup pass;
4. поднять `/runtime-preview`;
5. выполнить visual smoke.
