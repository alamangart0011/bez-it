# Runtime API shadow deploy

## Зачем нужен этот контур
Текущий live VPS contour уже рабочий, но использует legacy deploy path `backend/frontend`.
Этот shadow contour нужен для безопасной проверки нового runtime API `apps/api` рядом с живым сервером без риска сломать текущую песочницу.

## Что поднимается
- `docker-compose.runtime-api.yml`
- `apps/api/Dockerfile`
- локальный shadow API на порту `3002` по умолчанию

## Команды
Поднять shadow runtime API:
```bash
bash scripts/runtime_api_shadow_up.sh
```

Погасить shadow runtime API:
```bash
bash scripts/runtime_api_shadow_down.sh
```

Проверить отдельно smoke:
```bash
bash scripts/runtime_api_shadow_smoke.sh
```

## Что считать успехом
- `/health` -> 200
- `/api/meta` -> 200
- `/api/rooms` -> 200
- `/api/calls` -> 200
- `/api/transcripts` -> 200
- `/api/assistant` -> 200
- `/api/profile` -> 200
- `/api/admin` -> 200

## Практический смысл
Этот контур позволяет этапно поднять кодовую готовность нового runtime слоя до production cutover, не ломая уже живой HTTP contour песочницы.
