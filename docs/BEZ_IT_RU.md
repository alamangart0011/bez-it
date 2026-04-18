# bez-it.ru — лидогенерация для ИП Сапрыкина Е.В.

Актуально на **17 апреля 2026 г.**

Проект делает один сайт-воронку (`bez-it.ru`), который собирает заявки по всей России и маршрутизирует их двум подрядчикам:

- **НПК «Оборон-Экран»** (СПб, ИНН 7801322348) — лицензии ФСТЭК и ФСБ, разработка СКЗИ, КИИ, гос.
- **ООО «Центр Информационных Технологий»** (Москва, ИНН 5027295008) — коммерческая интеграция, СКУД, видеонаблюдение, 1С, аутсорсинг, лицензия ФСБ № Л051-00105-00/00591744/Н.

## Архитектура

```
apps/
  bez-it/public/           ← лендинг (nginx → /var/www/bez-it)
  ip-cabinet/public/       ← кабинет заявок (kabinet.bez-it.ru)

backend/src/
  repositories/bez-it-leads.repository.js
  services/bez-it-leads.service.js
  services/bez-it-router.service.js      ← маршрутизация в Telegram/webhook
  middleware/bez-it-cabinet-auth.js      ← токен-авторизация кабинета
  routes/bez-it-leads.js                 ← публичное + кабинет API

infra/sql/020_bez_it_leads.sql           ← таблицы: bez_it_leads,
                                           bez_it_lead_routes,
                                           bez_it_cabinet_tokens,
                                           bez_it_landing_stats

ops/nginx/bez-it.conf                    ← nginx для bez-it.ru + kabinet.bez-it.ru
```

## API

Публичные (без аутентификации, лимит 30 rpm):

- `POST /api/bez-it/leads` — приём заявки с лендинга. Поля: `contactName`, `phone|email`, `companyName`, `city`, `serviceKey`, `comment`, `quizAnswers`, `utm`, `routeTarget (oboron|cent|both)`.
- `POST /api/bez-it/leads/events` — аналитика (page_view, lead_submit_success и т.п.).

Кабинет (токен в `Authorization: Bearer ...` или `x-cabinet-token`):

- `GET  /api/bez-it/cabinet/leads?status=&search=&limit=&offset=`
- `GET  /api/bez-it/cabinet/leads/:id` — карточка + маршруты доставки
- `PATCH /api/bez-it/cabinet/leads/:id` — `{status, notes, assignedTo}`

## Маршрутизация

`bez-it-router.service.js` решает, куда отправлять заявку:

| serviceKey | Оборон-Экран | Cent-IT |
|---|---|---|
| `video_skud`, `cctv_install`, `network_sks`, `audit_ib` | ✔ | — |
| `it_outsourcing`, `server_support`, `antivirus_dlp`, `import_substitution` | — | ✔ |
| любое другое / `routeTarget=both` | ✔ | ✔ |

Каждая доставка фиксируется в `bez_it_lead_routes` (queued/sent/failed + last_error).

## ENV (см. `.env.example`)

```
BEZIT_TG_BOT_TOKEN      токен бота (@BotFather)
BEZIT_TG_OBORON_CHAT    chat_id Оборон-Экран
BEZIT_TG_CENT_CHAT      chat_id Cent-IT
BEZIT_TG_IP_CHAT        chat_id личного канала ИП (копия каждой заявки)
BEZIT_WEBHOOK_URL       (опц.) в CRM
BEZIT_CABINET_TOKEN     токен кабинета (сид пишется при первом запуске)
BEZIT_PUBLIC_RATE_LIMIT / BEZIT_CABINET_RATE_LIMIT
```

## Деплой

1. `psql ... -f infra/sql/020_bez_it_leads.sql`
2. Скопировать `apps/bez-it/public/*` → `/var/www/bez-it/`
3. Скопировать `apps/ip-cabinet/public/*` → `/var/www/ip-cabinet/`
4. `cp ops/nginx/bez-it.conf /etc/nginx/sites-available/ && ln -s .. sites-enabled`
5. `certbot --nginx -d bez-it.ru -d www.bez-it.ru -d kabinet.bez-it.ru`
6. `nginx -t && systemctl reload nginx`
7. Перезапустить api: `docker compose up -d api`

## Конверсионные механики на лендинге

- **Hero** с офертой КИИ-2026 (штраф до 500 000 ₽, УК 274.1).
- **Квиз** 3 шага + контакт — категоризация клиента и автоподбор сервиса.
- **Калькулятор штрафа** по КоАП 13.12.1 / УК 274.1.
- **Открытые цены** (от 85 000 ₽ аудит, от 350 000 ₽ лицензия ФСБ) — конкуренты прячут, мы показываем.
- **Exit-intent поп-ап** с чек-листом «КИИ-2026 за 7 шагов».
- **Sticky-CTA**: Позвонить / Telegram / WhatsApp.
- **robots.txt + sitemap.xml + canonical + Open Graph**.

## Вынесение в отдельный репозиторий

```
git subtree split --prefix=apps/bez-it --prefix=apps/ip-cabinet \
  --prefix=backend/src/repositories/bez-it-leads.repository.js \
  ... -b bez-it-export
# затем git remote add new git@github.com:<org>/bez-it-private.git
git push new bez-it-export:main
```

## Роли и процессы

| Роль | Ответственность |
|---|---|
| ИП Сапрыкина Е.В. | Приём заявок в кабинете, квалификация, передача подрядчику |
| Менеджер Оборон-Экран | КИИ/аттестация/СКЗИ — ответ в 30 мин |
| Менеджер Cent-IT | СКУД/аутсорсинг — ответ в 30 мин |
| Marketing/SEO | Wordstat-кластеры, посадочные подстраницы, А/Б-тесты |
| DevOps | Деплой, бэкап БД, мониторинг доставки в Telegram |
