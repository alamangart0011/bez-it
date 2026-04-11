# Web runtime preview deploy

## Цель
Собрать отдельный deployable preview contour для `apps/web` без ломки текущего live/root contour.

## Что добавлено
- `apps/web/Dockerfile`
- `docker-compose.runtime-web.yml`

Preview contour поднимается отдельно от API shadow и должен использоваться как следующая deploy-точка для `/runtime-preview`.

## Локальный / VPS запуск

### Сборка и запуск
```bash
cd /opt/messenger/contour-chat-jino-final

docker compose -f docker-compose.runtime-web.yml build --no-cache

docker compose -f docker-compose.runtime-web.yml up -d

docker compose -f docker-compose.runtime-web.yml ps
```

### Остановка
```bash
docker compose -f docker-compose.runtime-web.yml down --remove-orphans
```

## Smoke

### Локальный preview
Контейнер публикуется на `3300 -> 3000`.

Проверка:
```bash
curl -I http://127.0.0.1:3300/
```

### Базовая web smoke-проверка
Проверить:
1. открывается preview root;
2. нет 5xx на первом рендере;
3. отрисовываются `rooms` и `calls` runtime entrypoints;
4. transcript и assistant доступны как runtime-backed panels;
5. нет возврата к старому metadata-only path.

## Следующий обязательный шаг
После локального smoke:
- повесить preview на `/runtime-preview` через текущий HTTP contour;
- не переключать root;
- прогнать visual smoke `rooms -> calls -> transcript -> assistant`;
- только после стабильного preview собирать root cutover plan.

## Критерий готовности
Preview contour считается готовым, когда:
- собирается отдельным compose-файлом;
- стартует на отдельном порту;
- отдаёт рабочий web preview;
- проходит runtime visual smoke;
- не ломает текущий live contour.
