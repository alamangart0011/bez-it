# Module probe with token

## Назначение
`deploy/module_probe_with_token.sh` нужен для точечной проверки active baseline без полного redeploy и без повторного ручного обхода маршрутов.

Скрипт проверяет:
- базовый unauth runtime;
- модуль `me`;
- модуль `auth sessions`;
- модуль `admin`;
- модуль `rooms`;
- хвост API-логов после прогона.

## Когда использовать
Использовать в трёх случаях:
1. после recovery SQL-правок;
2. после локального исправления одного проблемного модуля;
3. когда `health` зелёный, но shell или admin ведут себя нестабильно.

## Что требуется
Нужен уже полученный access token пользователя с admin-доступом.

Пример запуска:
```bash
TOKEN='<access_token>' ./deploy/module_probe_with_token.sh
```

С SQL parity перед прогоном:
```bash
TOKEN='<access_token>' APPLY_SQL=1 ./deploy/module_probe_with_token.sh
```

С другим базовым URL:
```bash
TOKEN='<access_token>' BASE_URL='http://127.0.0.1:8080' ./deploy/module_probe_with_token.sh
```

## Что считается успехом
- `health/live/ready/release` возвращают `2xx`;
- `me` и `me/settings` отвечают без `500`;
- `auth/sessions` отвечает без `500`;
- `admin/overview`, `admin/users`, `admin/rooms`, `admin/invitations`, `admin/system`, `admin/incidents` отвечают без `500`;
- `rooms` отвечает без `500`;
- в хвосте логов нет нового явного crash-loop.

## Что делать, если probe упал
1. не менять baseline;
2. выполнить `./scripts/sql_parity_report.sh`;
3. снять `docker compose logs api db --tail=150`;
4. чинить только тот модуль, который реально упал;
5. если причина в схеме, добавлять следующий additive SQL-файл.

## Ограничение
Скрипт не делает логин сам и не хранит секреты. Это сознательно: probe должен быть безопасным и пригодным для запуска в любом окружении без жёстко прошитых учётных данных.
