# Web runtime preview safe mount

## Зачем
Если основной preview contour на `3300` упирается в build/runtime assumptions, использовать safe fallback contour на `3301`.

## Assets
- `apps/web/Dockerfile.preview-safe`
- `docker-compose.runtime-web-safe.yml`
- `infra/nginx/runtime-preview-safe.location.conf`
- `patches/runtime-preview-safe-nginx.patch`

## Порядок
1. поднять safe preview contour на `127.0.0.1:3301`;
2. применить safe nginx patch;
3. повесить внешний путь `/runtime-preview-safe`;
4. прогнать visual smoke;
5. не трогать root/live contour.

## Команды
```bash
cd /opt/messenger/contour-chat-jino-final

docker compose -f docker-compose.runtime-web-safe.yml build --no-cache

docker compose -f docker-compose.runtime-web-safe.yml up -d

git apply patches/runtime-preview-safe-nginx.patch

curl -I http://127.0.0.1:3301/
```

## Acceptance
Fallback mount считается рабочим, когда `/runtime-preview-safe/` стабильно отвечает и проходит тот же visual smoke, что и основной preview contour.
