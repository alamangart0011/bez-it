# Финализация одного контура

Цель: оставить один канонический baseline на `/opt/messenger/contour-chat-jino-final`, один deploy path и один домен `https://ai.voice.oboron-it.ru`.

## Что считаем каноном

- активный baseline: `room-based-v17`
- root: `/opt/messenger/contour-chat-jino-final`
- домен: `https://ai.voice.oboron-it.ru`
- preview-контур `app-*`, порт `8088` и nested release-каталоги внутри baseline должны быть убраны

Это соответствует `README.md`, где baseline уже собран как одна редакция без новой параллельной release-ветки, и `deploy/BASELINE.lock`, где root и domain зафиксированы как канонические. Также текущий deploy-контур уже целиком завязан на один `APP_DIR=/opt/messenger/contour-chat-jino-final` через `deploy/jino_one_command.sh`, `deploy/deploy.sh`, `deploy/doctor.sh`, `deploy/apply_sql.sh` и `deploy/post_deploy_check.sh`.

## Шаг 1. Проверить текущий baseline

```bash
cd /opt/messenger/contour-chat-jino-final
cat deploy/BASELINE.lock
./deploy/doctor.sh
```

Если `doctor.sh` падает на отсутствии `RULE_SINGLE_DEPLOY_PATH=true`, это нужно исправить до основного deploy.

## Шаг 2. Остановить временный preview-контур

```bash
docker compose -f /opt/messenger/contour-chat-jino-final/docker-compose.yml down --remove-orphans || true
docker rm -f $(docker ps -aq --filter 'name=^app-' --filter 'name=preview' --filter 'name=runtime-preview') 2>/dev/null || true
```

## Шаг 3. Удалить nested release-мусор внутри baseline

Проверить и удалить из `/opt/messenger/contour-chat-jino-final`, если там остались:

- `v14`
- `v15`
- `v16`
- `v17`
- `release`
- `releases`
- `runtime-preview`
- `preview`
- `app`

Пример:

```bash
cd /opt/messenger/contour-chat-jino-final
ls -la
rm -rf v14 v15 v16 v17 release releases runtime-preview preview app 2>/dev/null || true
```

## Шаг 4. Нормализовать baseline lock

В `deploy/BASELINE.lock` должны быть явно зафиксированы:

```text
BASELINE=room-based-v17
ROOT=/opt/messenger/contour-chat-jino-final
DOMAIN=https://ai.voice.oboron-it.ru
RULE_SINGLE_DEPLOY_PATH=true
PREVIEW_DISABLED=true
```

## Шаг 5. Проверить, что опубликован только один web-порт

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
```

После очистки не должно оставаться публикации `8088`.

## Шаг 6. Прогнать единый deploy-контур

```bash
cd /opt/messenger/contour-chat-jino-final
./deploy/jino_one_command.sh
```

Внутри уже должны отработать:

- `./deploy/doctor.sh`
- `./deploy/deploy.sh`
- `./deploy/apply_sql.sh`
- `./scripts/smoke_api.sh`
- `./deploy/post_deploy_check.sh`

## Шаг 7. Проверить локально и снаружи

```bash
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS http://127.0.0.1:8080/api/release
curl -fsS https://ai.voice.oboron-it.ru/api/health
```

## Шаг 8. Проверить, что preview-path больше не нужен

Если на хосте nginx всё ещё проксирует `/runtime-preview/` на `127.0.0.1:8088`, это нужно убрать в хостовом конфиге, иначе preview-техдолг будет оставаться даже после очистки контейнеров.

## Критерий готовности

Состояние считается правильным, когда одновременно выполняются все условия:

- существует только один baseline root: `/opt/messenger/contour-chat-jino-final`
- `deploy/BASELINE.lock` подтверждает single deploy path
- не осталось контейнеров `app-*` и опубликованного порта `8088`
- `README.md` и runtime-файлы не противоречат фактическому серверному состоянию
- `./deploy/jino_one_command.sh` проходит без ручного обхода
- `https://ai.voice.oboron-it.ru` и `https://ai.voice.oboron-it.ru/api/health` отвечают штатно
- дальнейшая полировка продукта идёт уже поверх одного room-based V17 baseline
