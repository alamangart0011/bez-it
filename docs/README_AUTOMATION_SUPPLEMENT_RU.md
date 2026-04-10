# README supplement: automation layer for `room-based-v17`

## Что добавлено поверх базового README
Для active baseline собран дополнительный automation-контур, который закрывает recovery, release-проверки и сбор audit-артефактов.

## Основные скрипты
- `deploy/automation_preflight.sh`
- `deploy/verify_automation_toolchain.sh`
- `deploy/automation_status_report.sh`
- `scripts/sql_parity_report.sh`
- `deploy/module_probe_with_token.sh`
- `deploy/recovery_orchestrator.sh`
- `deploy/build_runtime_audit_bundle.sh`
- `deploy/generate_runtime_audit_bundle.sh`
- `deploy/run_recovery_and_bundle.sh`

## Канонический порядок
1. preflight;
2. verify;
3. status report;
4. recovery orchestrator;
5. audit bundle.

## Связанные документы
- `docs/AUTOMATION_TOOLCHAIN_INDEX_RU.md`
- `docs/AUTOMATION_PREFLIGHT_AND_VERIFY_RU.md`
- `docs/AUTOMATION_STATUS_REPORT_RU.md`
- `docs/ONE_COMMAND_AUTOMATION_RUNBOOK_RU.md`
