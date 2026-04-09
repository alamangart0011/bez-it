# CorpChat V17 — финальный хостинговый прогон на Jino

## Команда запуска
```bash
cd /opt/messenger/contour-chat-jino-final && ./deploy/jino_one_command.sh
```

## Что делает сценарий
1. Проверяет baseline discipline и docker compose config.
2. Делает backup текущего каталога.
3. Пересобирает `api` и `web`.
4. Поднимает контур.
5. Применяет все SQL-миграции из `infra/sql`.
6. Проверяет локальный health.
7. Гоняет smoke API.
8. Проверяет `/api/release` и внешний `api/health`.
9. Проверяет, что legacy API (`/api/ai`, `/api/e2e`, `/api/qr_phone_auth`) отвечают `410`.

## Что проверить руками после деплоя
- логин под `admin@corpchat.local`;
- текстовую комнату;
- загрузку файла;
- вход в голосовую комнату;
- mute/deafen;
- перенос участника;
- комнату для собраний;
- админ-центр.
- `curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/ai` возвращает `410`;
- `curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/e2e` возвращает `410`;
- `curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/qr_phone_auth` возвращает `410`.
