# CorpChat V17 — этап 0 / baseline и release discipline

## Что зафиксировано

- Канонический baseline один: `/opt/messenger/contour-chat-jino-final`
- Внутри production-корня не допускаются новые вложенные боевые каталоги вроде `v14`, `v15`, `v16`, `v17`
- Выкладка идёт по одному пути через `deploy/deploy.sh`
- Проверка состояния baseline вынесена в `deploy/doctor.sh`
- Отдельный rollback вынесен в `deploy/rollback.sh`
- Правила baseline вынесены в `deploy/BASELINE.lock`

## Что считается нарушением

- распаковка новой редакции внутрь уже живого baseline как отдельного вложенного каталога;
- несколько параллельных docker-compose внутри production-корня;
- выкладка без внешнего backup;
- выкладка без smoke-проверки и без health-check;
- отсутствие понятного rollback.

## Минимальный порядок выкладки

1. `deploy/doctor.sh`
2. внешний backup baseline
3. `docker compose build`
4. `docker compose up -d`
5. проверка `api/health`
6. `scripts/smoke_api.sh`
7. при сбое — `deploy/rollback.sh`

## Что закрывает этап 0

- хаос параллельных редакций;
- потерю точки возврата;
- неуправляемую выкладку без smoke и rollback;
- размывание понятия baseline.
