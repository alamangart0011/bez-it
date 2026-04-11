# Sandbox deploy runbook

## Цель
Поднять текущую редакцию ветки `project/signalum-voice-foundation-20260410` на песочнице `https://ai.voice.oboron-it.ru` через существующий VPS-контур без создания параллельных baseline.

## Базовые допущения
- рабочий каталог приложения: `/opt/messenger/contour-chat-jino-final`
- docker compose уже используется как основной способ подъёма
- reverse proxy уже направляет внешний трафик на локальный порт приложения
- доступ к VPS и web-консоли уже выдан отдельно и не хранится в репозитории

## Обновление кода
```bash
cd /opt/messenger/contour-chat-jino-final

git fetch origin
git checkout project/signalum-voice-foundation-20260410
git reset --hard origin/project/signalum-voice-foundation-20260410
```

## Пересборка и запуск
```bash
cd /opt/messenger/contour-chat-jino-final

docker compose down --remove-orphans || true
docker compose build --no-cache api web
docker compose up -d
sleep 12
docker compose ps
```

## Локальные smoke-checks на VPS
```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/api/meta
curl -fsS http://127.0.0.1:8080/api/rooms
curl -fsS http://127.0.0.1:8080/api/calls
curl -fsS http://127.0.0.1:8080/api/transcripts
curl -fsS http://127.0.0.1:8080/api/assistant
```

## Внешние smoke-checks
```bash
curl -kfsS https://ai.voice.oboron-it.ru/health
curl -kfsS https://ai.voice.oboron-it.ru/api/meta
curl -kfsS https://ai.voice.oboron-it.ru/api/rooms
curl -kfsS https://ai.voice.oboron-it.ru/api/calls
curl -kfsS https://ai.voice.oboron-it.ru/api/transcripts
curl -kfsS https://ai.voice.oboron-it.ru/api/assistant
```

## Логи при ошибке
```bash
cd /opt/messenger/contour-chat-jino-final

docker compose logs api --tail=120
docker compose logs web --tail=120
docker compose logs db --tail=120
```

## Критерии готовности песочницы
- `/health` отвечает 200
- `/api/meta` отвечает 200
- `rooms/calls/transcripts/assistant` отдают JSON payload
- контейнеры `api`, `web`, `db` находятся в состоянии `Up`
- домен `https://ai.voice.oboron-it.ru` доступен извне

## Что уже должно быть видно после деплоя
- живой runtime API
- rooms payload
- calls payload
- transcript runtime panel
- assistant runtime panel
- связанный runtime flow `rooms -> calls -> transcript -> assistant`
