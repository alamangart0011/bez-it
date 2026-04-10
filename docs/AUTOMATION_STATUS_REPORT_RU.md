# Статусный отчёт по automation-toolchain

## Назначение
`deploy/automation_status_report.sh` быстро показывает, какие звенья automation-цепочки реально присутствуют в active baseline.

## Что проверяется
- baseline lock;
- doctor/apply_sql/runtime parity/release/post-check;
- preflight и verifier;
- module probe и recovery orchestrator;
- audit bundle builders;
- smoke и sql parity report;
- ключевые документы automation-слоя.

## Запуск
```bash
./deploy/automation_status_report.sh
```

## Формат вывода
- `OK|<path>` — файл есть;
- `MISS|<path>` — файл отсутствует.

## Когда использовать
1. перед handoff;
2. перед запуском automation-cycle;
3. после добавления новых recovery/release инструментов.
