# Runtime cutover plan

## Цель
Перевести песочницу с текущего live legacy contour `backend/frontend` на целевой runtime contour `apps/api + apps/web` без потери управляемости и с чёткими критериями готовности.

## Текущее состояние
- legacy live contour уже operational
- public HTTP health green
- Jino 443 proxy remains external blocker
- apps/api can now be validated as shadow contour on a separate local port

## Этап 1. Shadow validation of runtime API
Критерии:
- shadow `apps/api` поднимается отдельно
- `/health` -> 200
- `/api/meta` -> 200
- `/api/rooms` -> 200
- `/api/calls` -> 200
- `/api/transcripts` -> 200
- `/api/assistant` -> 200
- `/api/profile` -> 200
- `/api/admin` -> 200

Команды:
```bash
bash scripts/runtime_api_shadow_up.sh
bash scripts/runtime_api_shadow_smoke.sh
bash scripts/runtime_api_compare.sh
```

## Этап 2. External HTTPS stabilization
Критерии:
- Jino proxy publishes external 443 on the correct IP
- `https://ai.voice.oboron-it.ru/` works
- `https://ai.voice.oboron-it.ru/api/health` -> 200

Команды:
```bash
bash scripts/jino_proxy_probe.sh
bash scripts/jino_https_smoke.sh
bash scripts/jino_release_status.sh
```

## Этап 3. Runtime web readiness
Критерии:
- apps/web gets a deployable contour
- room -> call -> transcript -> assistant path is visible in one continuous demo flow

## Этап 4. Final cutover decision
Cutover allowed only when:
- legacy contour remains stable
- runtime API shadow is green
- external HTTPS is green
- runtime web contour is demonstrable
- auth/register/reset path is validated for the target contour

## Управленческий смысл
До финального cutover песочница считается live and operational, but transitional. Runtime contour evolves in parallel and must prove readiness before replacing the live legacy path.
