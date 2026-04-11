# Web runtime preview fallback

## Зачем
Основной preview contour уже собран через:
- `apps/web/Dockerfile`
- `docker-compose.runtime-web.yml`

Но в ветке не найден `pnpm-lock.yaml`, а также не подтвержден `next.config*` в `apps/web`, поэтому добавлен fallback preview path.

## Fallback assets
- `apps/web/Dockerfile.preview-safe`
- `docker-compose.runtime-web-safe.yml`

## Когда использовать fallback
Использовать fallback, если основной preview contour:
- не собирается корректно;
- падает на runtime build assumptions;
- требует более безопасного runner path.

## Запуск fallback
```bash
cd /opt/messenger/contour-chat-jino-final

docker compose -f docker-compose.runtime-web-safe.yml build --no-cache

docker compose -f docker-compose.runtime-web-safe.yml up -d

docker compose -f docker-compose.runtime-web-safe.yml ps

curl -I http://127.0.0.1:3301/
```

## Роль fallback
Fallback не заменяет основной plan.
Он нужен как страховочный deploy path, чтобы не стопорить runtime-preview acceptance.
