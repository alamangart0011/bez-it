# Индекс инструментов автоматизации для `room-based-v17`

## Назначение
Документ фиксирует все основные инструменты автоматизации active baseline, чтобы recovery, release и аудит запускались по канонической цепочке, а не по памяти из чата.

## Базовые инструменты
- `deploy/doctor.sh` — проверка single-baseline discipline и production-root.
- `deploy/apply_sql.sh` — последовательное применение SQL-слоёв active baseline.
- `deploy/runtime_parity_apply_and_check.sh` — проверка runtime parity после SQL.
- `scripts/smoke_api.sh` — минимальный smoke-контракт API.
- `deploy/post_deploy_check.sh` — быстрый post-deploy контроль runtime.

## Recovery и точечная диагностика
- `scripts/sql_parity_report.sh` — отчёт по schema parity и ключевым таблицам.
- `deploy/module_probe_with_token.sh` — точечная проверка модулей `me`, `auth`, `admin`, `rooms` по access token.
- `deploy/recovery_orchestrator.sh` — связка parity report + module probe + post-check + compose state.

## Audit bundle
- `deploy/build_runtime_audit_bundle.sh` — сбор всех результатов recovery/release в пакет артефактов.
- `deploy/generate_runtime_audit_bundle.sh` — wrapper для bundle-builder.
- `deploy/run_recovery_and_bundle.sh` — one-command запуск recovery и сборки audit bundle.

## Release fastpath
- `deploy/release_parity_and_smoke.sh` — быстрый релизный прогон для active baseline.

## Канонический порядок запуска
1. `./deploy/doctor.sh`
2. `./deploy/apply_sql.sh`
3. `./deploy/runtime_parity_apply_and_check.sh`
4. `./scripts/smoke_api.sh http://127.0.0.1:3001`
5. `TOKEN='<access_token>' ./deploy/module_probe_with_token.sh`
6. `TOKEN='<access_token>' ./deploy/run_recovery_and_bundle.sh`

## Что это даёт
- один baseline;
- один понятный recovery cycle;
- один понятный release fastpath;
- один audit bundle для разбора инцидентов и передачи статуса.
