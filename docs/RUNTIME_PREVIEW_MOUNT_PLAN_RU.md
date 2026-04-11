# Runtime preview mount plan

## Цель
Подключить новый `apps/web` preview contour на путь `/runtime-preview` без переключения root.

## Предпосылки
В ветке уже есть:
- `apps/web/Dockerfile`
- `docker-compose.runtime-web.yml`
- `WEB_RUNTIME_PREVIEW_DEPLOY_RU.md`

Preview контейнер публикуется на `3300 -> 3000`.

## Правильный порядок
1. собрать preview compose;
2. поднять preview на `127.0.0.1:3300`;
3. проверить root preview локально;
4. повесить reverse-proxy path `/runtime-preview` -> `http://127.0.0.1:3300`;
5. прогнать visual smoke;
6. только после этого обсуждать root cutover.

## Proxy logic
Внешний root не трогать.

Нужен отдельный path-based mount:
- external: `/runtime-preview`
- upstream: `http://127.0.0.1:3300`

## Smoke checklist
Проверить:
- `/runtime-preview` открывается;
- комнаты открываются;
- звонки открываются;
- transcript panel приходит из runtime;
- assistant panel приходит из runtime;
- нет возврата к старому metadata-only path;
- текущий root/live contour не пострадал.

## Что нельзя делать
- не переключать root до стабильного preview;
- не ломать текущий HTTP live contour;
- не смешивать preview и live в один контейнер;
- не удалять старый path до визуального smoke.

## Критерий готовности
Preview mount считается закрытым, когда:
- `/runtime-preview` стабильно отвечает;
- preview живет в отдельном contour;
- визуальный runtime smoke проходит;
- root остается нетронутым.
