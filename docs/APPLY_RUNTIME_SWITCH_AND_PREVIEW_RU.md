# Apply runtime switch and preview patches

## Цель
Механически применить уже подготовленные в ветке patch-артефакты:
- `patches/runtime-web-switch.patch`
- `patches/runtime-preview-nginx.patch`

## Применение runtime switch
```bash
cd /opt/messenger/contour-chat-jino-final

git apply patches/runtime-web-switch.patch
```

После этого existing файлы должны перейти на `*-next` runtime-wired exports:
- `pages/rooms-page.ts`
- `pages/calls-page.ts`
- `views/rooms-view.ts`
- `views/calls-view.ts`
- `adapters/rooms-page-adapter.ts`
- `adapters/calls-page-adapter.ts`

## Применение preview nginx patch
```bash
cd /opt/messenger/contour-chat-jino-final

git apply patches/runtime-preview-nginx.patch
```

## После применения
1. прогнать cleanup pass;
2. собрать `docker-compose.runtime-web.yml`;
3. поднять preview contour;
4. проверить `/runtime-preview`;
5. выполнить visual smoke.

## Проверка patch status
```bash
git status --short
```

## Если patch уже применен
Если `git apply` возвращает reject из-за уже измененных файлов, это означает, что switch или nginx mount уже внедрены частично/полностью. В этом случае сверять нужно с:
- `WEB_RUNTIME_ONE_TO_ONE_SWITCH_MAP_RU.md`
- `WEB_RUNTIME_SWITCH_SNIPPETS_RU.md`
- `RUNTIME_PREVIEW_MOUNT_PLAN_RU.md`
