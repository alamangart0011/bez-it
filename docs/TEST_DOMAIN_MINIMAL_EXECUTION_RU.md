# Test domain minimal execution order

## Минимальный порядок
1. `git apply patches/runtime-web-switch.patch`
2. `git apply patches/runtime-preview-nginx.patch`
3. `docker compose -f docker-compose.runtime-web.yml build --no-cache`
4. `docker compose -f docker-compose.runtime-web.yml up -d`
5. положить `infra/nginx/runtime-preview.test-domain.server.conf` в nginx
6. `nginx -t && systemctl reload nginx`
7. открыть `http://<TEST_DOMAIN>/runtime-preview/`
8. пройти `TEST_DOMAIN_AUDIT_SEQUENCE_RU.md`

## Fallback
Если основной contour нестабилен:
1. `git apply patches/runtime-preview-safe-nginx.patch`
2. `docker compose -f docker-compose.runtime-web-safe.yml build --no-cache`
3. `docker compose -f docker-compose.runtime-web-safe.yml up -d`
4. открыть `http://<TEST_DOMAIN>/runtime-preview-safe/`

## Acceptance
На тестовом домене должен открываться хотя бы один рабочий preview path для полноценного аудита сайта.
