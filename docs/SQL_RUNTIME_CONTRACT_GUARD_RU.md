# SQL runtime contract guard

## Назначение
`./scripts/sql_runtime_contract_guard.sh` — это жёсткая проверка минимального SQL-контракта active baseline `room-based-v17`.

В отличие от `sql_parity_report.sh`, этот скрипт не просто показывает состояние схемы, а завершает выполнение с ошибкой, если обязательные таблицы или колонки отсутствуют.

## Что проверяется
### Обязательные таблицы
- `users`
- `rooms`
- `room_members`
- `user_profiles`
- `departments`
- `auth_sessions`
- `password_reset_tokens`
- `invitations`
- `system_settings`
- `audit_logs`
- `voice_participants`
- `room_join_requests`
- `meetings`
- `meeting_events`
- `meeting_presence_logs`
- `room_incidents`

### Обязательные колонки
Проверяются ключевые колонки, на которые завязан runtime: `display_name`, `username`, `status`, `is_active`, `password_hash`, `entry_mode`, `is_private`, `is_archived`, `voice_role`, `incident_type`, `value_json` и другие базовые поля.

## Когда запускать
1. после `apply_sql.sh`;
2. перед `module_probe_with_token.sh`;
3. перед handoff на сервер;
4. после добавления нового parity SQL-файла.

## Канонический порядок
1. `./deploy/automation_preflight.sh`
2. `./deploy/apply_sql.sh`
3. `./scripts/sql_runtime_contract_guard.sh`
4. `./deploy/module_probe_with_token.sh`

## Критерий успеха
Скрипт заканчивается строкой:
`[OK] sql runtime contract guard passed`

Если таблицы или колонки отсутствуют, скрипт завершится ошибкой и покажет missing tables / missing columns.
