# PR13 one-shot execution

## Цель
Дать один линейный блок команд для финального выполнения подготовленного runtime closure пакета.

## Блок команд
```bash
cd /opt/messenger/contour-chat-jino-final && \

git apply patches/runtime-web-switch.patch && \

git apply patches/runtime-preview-nginx.patch && \

docker compose -f docker-compose.runtime-web.yml build --no-cache && \

docker compose -f docker-compose.runtime-web.yml up -d && \

docker compose -f docker-compose.runtime-web.yml ps && \

curl -I http://127.0.0.1:3300/
```

## После блока
Сразу пройти:
- `docs/WEB_RUNTIME_CLEANUP_PASS_RU.md`
- `docs/WEB_RUNTIME_VISUAL_SMOKE_RU.md`

## Что должен дать блок
- existing `rooms/calls` entrypoints переключены на runtime-wired path;
- preview contour поднят;
- локальный preview отвечает на `127.0.0.1:3300`.

## Что не делает этот блок
- не монтирует внешний `/runtime-preview` сам по себе;
- не трогает root;
- не завершает visual smoke автоматически.
