# Песочница bez-it.ru

Изолированный docker compose-стек, чтобы запустить лендинг + кабинет + API + (опционально) Telegram-бот для тестирования.

## Что внутри

| Сервис | Порт | Назначение |
| --- | --- | --- |
| `bez-it-db` | 127.0.0.1:5436 | PostgreSQL 16, схема создаётся из `infra/sql/020_bez_it_leads.sql` |
| `bez-it-api` | 127.0.0.1:3001 | Backend Node.js, единственный путь `/api/bez-it/*` |
| `bez-it-web` | $BEZIT_HTTP_PORT (8088) | nginx со статикой лендинга и кабинета (по `/kabinet/`) |
| `bez-it-bot` | — | Telegram-бот, профиль `bot` |

## Быстрый старт

```bash
cd ops/bez-it-sandbox
./up.sh             # копирует .env.sandbox.example → .env, поднимает стек
./smoke.sh          # 20 smoke-проверок
```

После `./up.sh` доступно:

- лендинг: http://localhost:8088/
- кабинет: http://localhost:8088/kabinet/ (токен из `.env`)
- API: http://localhost:8088/api/bez-it/

## С Telegram-ботом

```bash
# в .env вставьте BEZIT_TG_BOT_TOKEN, BEZIT_TG_IP_CHAT
docker compose -f docker-compose.bez-it.yml --env-file .env --profile bot up -d bez-it-bot
docker compose -f docker-compose.bez-it.yml logs -f bez-it-bot
```

## Перенос на Jino / VPS

1. Скопируйте репозиторий на сервер: `git clone … && cd bez-it`
2. `cd ops/bez-it-sandbox && cp .env.sandbox.example .env`
3. Замените все `*_change_me`, заполните Telegram-токены, поставьте свой `BEZIT_HTTP_PORT` (если 80 уже занят).
4. `./up.sh && ./smoke.sh`
5. Для production-домена с HTTPS — используйте `ops/nginx/bez-it.conf` на хост-машине вместо контейнерного nginx (uncomment `network_mode: host` или пробросьте 127.0.0.1:8088 в host-nginx как upstream).

## Остановка

```bash
./down.sh                  # останавливает стек, БД сохраняется
docker compose down -v     # полностью удалить, включая БД
```
