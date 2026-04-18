# bez-it-telegram-bot

Telegram-бот для приёма заявок на bez-it.ru напрямую из мессенджера. Альтернатива форме на сайте — особенно для повторных клиентов и при «горящих» вопросах.

## Возможности

- `/start` — приветствие, короткое меню услуг
- Кнопочный flow: выбор услуги → имя → телефон → описание задачи
- Заявка POST-ится в `/api/bez-it/leads` с `channel: "tg_bot"`
- Копия в чат ИП (если задан `BEZIT_TG_IP_CHAT`)
- Команда `/contact` — телефон и Telegram-канал
- Команда `/cancel` — сбросить текущий диалог

## Запуск

```bash
cp .env.example .env
# вставьте токен от @BotFather
npm install
npm start
```

## Деплой

На сервере:

```bash
cd /opt/bez-it-bot
git pull
npm ci --omit=dev
pm2 restart bez-it-bot   # или systemd unit
```

## Webhook-режим

Для production лучше webhook (не нужен постоянный outbound polling):

```
BEZIT_BOT_MODE=webhook
BEZIT_BOT_WEBHOOK_URL=https://bot.bez-it.ru/tg
BEZIT_BOT_PORT=3010
```

И настройте nginx-прокси `/tg` → `127.0.0.1:3010`.
