# Sandbox ready bundle

## Цель
Собрать в одном месте весь пакет, который нужен для вывода runtime preview на тестовый домен и последующего аудита сайта.

## Switch
- `patches/runtime-web-switch.patch`
- `docs/WEB_RUNTIME_SWITCH_RUNBOOK_RU.md`
- `docs/WEB_RUNTIME_SWITCH_SNIPPETS_RU.md`
- `docs/WEB_RUNTIME_ONE_TO_ONE_SWITCH_MAP_RU.md`

## Preview contours
### Main preview
- `apps/web/Dockerfile`
- `docker-compose.runtime-web.yml`
- `infra/nginx/runtime-preview.location.conf`
- `patches/runtime-preview-nginx.patch`

### Safe preview
- `apps/web/Dockerfile.preview-safe`
- `docker-compose.runtime-web-safe.yml`
- `infra/nginx/runtime-preview-safe.location.conf`
- `patches/runtime-preview-safe-nginx.patch`

## Test domain
- `infra/nginx/runtime-preview.test-domain.server.conf`
- `docs/TEST_DOMAIN_AUDIT_SEQUENCE_RU.md`
- `docs/TEST_DOMAIN_SCREEN_AUDIT_MATRIX_RU.md`
- `docs/SANDBOX_GO_LIVE_SEQUENCE_RU.md`

## Apply / execution
- `docs/APPLY_RUNTIME_SWITCH_AND_PREVIEW_RU.md`
- `docs/PR13_ONE_SHOT_EXECUTION_RU.md`
- `docs/PR13_SMOKE_SEQUENCE_RU.md`
- `ops/pr13_runtime_one_shot_commands.txt`

## Cleanup / finish
- `docs/WEB_RUNTIME_CLEANUP_PASS_RU.md`
- `docs/WEB_RUNTIME_VISUAL_SMOKE_RU.md`
- `docs/PR13_FINAL_ACTION_BLOCK_RU.md`
- `docs/PR13_FINAL_CHECKLIST_RU.md`

## Практический итог
Этот bundle уже покрывает:
1. switch existing entrypoints;
2. main preview contour;
3. safe preview contour;
4. mount на тестовый домен;
5. screen-by-screen audit.
