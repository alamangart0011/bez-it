# Test domain apply values

## Цель
Зафиксировать, какие значения нужно подставить в готовые preview-артефакты перед выводом на тестовый домен.

## Подставляемые значения
- `<TEST_DOMAIN>` -> фактический тестовый домен песочницы
- основной preview upstream -> `http://127.0.0.1:3300`
- safe preview upstream -> `http://127.0.0.1:3301`
- основной preview path -> `/runtime-preview/`
- safe preview path -> `/runtime-preview-safe/`

## Где подставлять
- `infra/nginx/runtime-preview.test-domain.server.conf`
- команды из rollout/apply/runbook документов
- при необходимости в локальных shell-командах deploy-оператора

## Проверка после подстановки
1. `nginx -t`
2. `curl -I http://127.0.0.1:3300/`
3. `curl -I http://127.0.0.1:3301/`
4. открыть `http://<TEST_DOMAIN>/runtime-preview/`
5. открыть `http://<TEST_DOMAIN>/runtime-preview-safe/`
