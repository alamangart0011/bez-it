# Sandbox execution card

## Цель
Дать короткую карточку исполнения для вывода runtime preview в песочницу и открытия сайта на тестовом домене.

## Что выполнить
1. применить `patches/runtime-web-switch.patch`;
2. поднять `docker-compose.runtime-web.yml`;
3. при необходимости поднять `docker-compose.runtime-web-safe.yml`;
4. положить `infra/nginx/runtime-preview.test-domain.server.conf`;
5. проверить `nginx -t` и reload;
6. открыть `/runtime-preview/`;
7. при проблеме открыть `/runtime-preview-safe/`;
8. пройти экранный аудит.

## Основные адреса
- primary: `http://<TEST_DOMAIN>/runtime-preview/`
- fallback: `http://<TEST_DOMAIN>/runtime-preview-safe/`

## Основные документы
- `docs/SANDBOX_READY_BUNDLE_RU.md`
- `docs/TEST_DOMAIN_MINIMAL_EXECUTION_RU.md`
- `docs/TEST_DOMAIN_AUDIT_SEQUENCE_RU.md`
- `docs/TEST_DOMAIN_SCREEN_AUDIT_MATRIX_RU.md`
- `docs/PR13_RUNTIME_AUDIT_REPORT_TEMPLATE_RU.md`

## Практический критерий успеха
Хотя бы один preview path должен открываться на тестовом домене и проходить экранный аудит без поломки root/live contour.
