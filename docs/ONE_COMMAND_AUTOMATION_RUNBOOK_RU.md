# One-command automation runbook

## Назначение
Документ описывает канонический запуск полного automation-цикла для active baseline `room-based-v17`.

## Главная команда
Запускается `deploy/run_recovery_and_bundle.sh`.

## Что делает команда
1. запускает `deploy/recovery_orchestrator.sh`;
2. собирает audit bundle через `deploy/generate_runtime_audit_bundle.sh`;
3. оставляет архив артефактов для recovery и release-анализа.

## Перед запуском рекомендуется
1. `deploy/automation_preflight.sh`
2. `deploy/verify_automation_toolchain.sh`
3. `deploy/automation_status_report.sh`

## Что нужно для полного protected-run
- рабочий `TOKEN` в окружении;
- при необходимости `BASE_URL`, `APP_DIR`, `ARTIFACT_ROOT`, `APPLY_SQL`.

## Критерий успеха
- recovery orchestrator проходит без stop-error;
- audit bundle собирается;
- артефакты доступны в `artifacts/runtime_audit`.
