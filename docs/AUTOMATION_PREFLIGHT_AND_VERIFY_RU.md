# Preflight и проверка automation-toolchain

## Назначение
Эти скрипты нужны, чтобы automation не запускалась вслепую на битой среде.

## Скрипты
- `deploy/automation_preflight.sh` — проверяет команды, обязательные файлы, compose state, базовый runtime и режим токена.
- `deploy/verify_automation_toolchain.sh` — проверяет наличие и shell-синтаксис всех ключевых automation-скриптов.

## Когда запускать
1. перед recovery;
2. перед release fastpath;
3. после любых изменений в deploy/recovery/audit слое.

## Примеры
```bash
./deploy/automation_preflight.sh
./deploy/verify_automation_toolchain.sh
```

С токеном и кастомным URL:
```bash
TOKEN='<access_token>' BASE_URL='http://127.0.0.1:3001' ./deploy/automation_preflight.sh
```

## Что считается успехом
- обязательные команды доступны;
- все базовые automation-файлы существуют;
- `docker compose ps` не падает;
- `/api/health` и `/api/release` отвечают;
- shell-синтаксис automation-файлов проходит без ошибок.

## Практический порядок
1. `./deploy/automation_preflight.sh`
2. `./deploy/verify_automation_toolchain.sh`
3. `TOKEN='<access_token>' ./deploy/run_recovery_and_bundle.sh`
