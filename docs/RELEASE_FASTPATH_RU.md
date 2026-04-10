# Быстрый путь релиза для active baseline

## Когда использовать
Этот fastpath нужен для двух сценариев:
1. после вливания изменений в активный baseline `room-based-v17`;
2. после recovery-schema правок, когда нужно быстро подтвердить, что runtime снова целый.

## Каноническая команда
```bash
./deploy/release_parity_and_smoke.sh
```

## Что делает fastpath
1. запускает `./deploy/doctor.sh`;
2. применяет SQL parity через `./deploy/apply_sql.sh`;
3. прогоняет runtime parity через `./deploy/runtime_parity_apply_and_check.sh`;
4. запускает smoke-check через `./scripts/smoke_api.sh`;
5. выполняет `./deploy/post_deploy_check.sh`.

## Переменные окружения
- `APP_DIR` — production root, по умолчанию `/opt/messenger/contour-chat-jino-final`
- `BASE_URL` — внутренняя база для smoke, по умолчанию `http://127.0.0.1:3001`
- `EXTERNAL_HEALTH_URL` — необязательная внешняя health-check ссылка

Пример:
```bash
APP_DIR=/opt/messenger/contour-chat-jino-final \
BASE_URL=http://127.0.0.1:3001 \
EXTERNAL_HEALTH_URL=https://ai.voice.oboron-it.ru/api/health \
./deploy/release_parity_and_smoke.sh
```

## Минимальный критерий успеха
- `doctor` не падает;
- SQL проходит без stop-error;
- `/api/health`, `/api/live`, `/api/ready`, `/api/release` отвечают корректно;
- защищённые runtime-endpoints требуют авторизацию;
- `post_deploy_check.sh` не сообщает о явном деграде;
- контейнеры остаются в рабочем состоянии после прогона.

## Что делать, если fastpath упал
1. не плодить новый baseline;
2. не создавать новую релизную ветку в production-root;
3. выполнить `./deploy/sql_parity_report.sh`;
4. снять `docker compose logs api db --tail=150`;
5. чинить проблему следующим additive SQL-файлом или точечным recovery в модуле.
