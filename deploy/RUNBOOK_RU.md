# CorpChat V14 — Jino Runbook

## 0. Что за пакет
V14 — это собранный production-oriented пакет после полной ревизии истории проекта, V10/V11/V13 и кода.

## 1. Путь на VPS
Канонический путь проекта:
`/opt/messenger/contour-chat-jino-final`

## 2. Загрузка на сервер
Вариант через SCP:
```bash
scp corpchat_v14_final_product_pack.zip root@YOUR_HOST:/opt/messenger/
ssh root@YOUR_HOST
cd /opt/messenger
unzip -o corpchat_v14_final_product_pack.zip -d contour-chat-jino-final
cd contour-chat-jino-final
```

Если архив уже распакован локально и пушится git/rsync — просто замените содержимое каталога проекта.

## 3. Подготовка .env
```bash
cd /opt/messenger/contour-chat-jino-final
cp -n .env.example .env
nano .env
```

Обязательные поля для production:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `RTC_TURN_URLS`
- `RTC_TURN_USERNAME`
- `RTC_TURN_CREDENTIAL`

## 4. Первый запуск
```bash
cd /opt/messenger/contour-chat-jino-final
docker compose build
docker compose up -d
./scripts/smoke_api.sh http://127.0.0.1:3001
```

## 5. Боевой деплой
```bash
cd /opt/messenger/contour-chat-jino-final
./deploy/deploy.sh
```

Скрипт:
- делает backup текущего каталога;
- пересобирает контейнеры;
- ждёт `api/health`;
- гоняет smoke;
- при провале откатывает содержимое каталога.

## 6. Проверки после деплоя
```bash
docker compose ps
docker compose logs api --tail=100
docker compose logs web --tail=100
curl -fsS http://127.0.0.1:8080/api/health
```

Ручные проверки из браузера:
1. login;
2. открыть комнату;
3. отправить сообщение;
4. загрузить файл;
5. edit / delete / pin;
6. открыть голосовую комнату;
7. включить микрофон;
8. включить демонстрацию экрана;
9. проверить аудит.

## 7. Jino / reverse proxy
У вас уже был подтверждён рабочий внешний контур с `80/443 -> 8080` и `api/health = 200`.
Для WebSocket критично сохранить проксирование пути `/socket.io` на тот же backend-контур.

## 8. TURN
Для реального voice + screen-share между внешними сетями нужен свой TURN внутри вашего контура.
Минимум:
- отдельный coturn;
- белый IP или корректный NAT mapping;
- креды в `.env`;
- проверка UDP/TCP reachability.

## 9. Откат вручную
```bash
cd /opt/messenger/contour-chat-jino-final
docker compose down --remove-orphans
cd /opt/messenger
mkdir -p contour-chat-jino-final.rollback
tar -xzf /opt/messenger/backups/corpchat_YYYYMMDD_HHMMSS.tar.gz -C contour-chat-jino-final.rollback
```

## 10. Что не забыть
- не использовать внешние CDN внутри рабочего контура;
- не оставлять `.env.example` как боевой файл;
- держать `uploads_data` и `postgres_data` на persistent volume;
- для крупных голосовых комнат планировать SFU-слой.
