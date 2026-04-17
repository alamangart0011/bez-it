# Проекты bez-it.ru — портативная структура

Актуально на **17 апреля 2026**.

Каждая папка — самодостаточный проект. Скачал → зашёл внутрь → `./start.sh` (или `make up`) → работает.

| Папка | Проект | Как запустить |
|---|---|---|
| `00-docs/` | Общая документация, оглавление, чек-листы | Читать |
| `01-landing-bez-it/` | Лендинг https://bez-it.ru (HTML/CSS/JS, без сборки) | `./start.sh` → http://127.0.0.1:8765 |
| `02-cabinet-ip/` | Кабинет ИП Сапрыкина Е.В. (одна HTML-страница) | `./start.sh` → http://127.0.0.1:8766 |
| `03-api-leads/` | Backend-API приёма лидов и кабинета (Node + Postgres + Docker) | `docker compose up -d` → http://127.0.0.1:3001 |
| `04-research/` | Конкуренты, ПП-313 СКЗИ, рынок РФ 2026, ключевые запросы, роли | Читать |
| `05-ops-deploy/` | Nginx, certbot, backup, SRE-скрипты | По README внутри |
| `06-telegram-bot/` | Заготовка Telegram-бота для приёма заявок в чаты партнёров | `npm start` (после npm install) |

## Полный локальный старт (все проекты на одном хосте)

```bash
cd 03-api-leads   && docker compose up -d        # БД + API на :3001
cd ../01-landing-bez-it && ./start.sh &          # Лендинг на :8765
cd ../02-cabinet-ip     && ./start.sh &          # Кабинет на :8766
open http://127.0.0.1:8765
```

## Как вынести в отдельные приватные репозитории GitHub

Каждая папка проектов — уже готовый корень для отдельного репо. Вариант 1 — разделение через `git subtree split`:

```bash
git subtree split --prefix=projects/01-landing-bez-it -b export/landing
git push git@github.com:<org>/bez-it-landing.git export/landing:main
```

Вариант 2 (проще) — ручное копирование:

```bash
for p in 01-landing-bez-it 02-cabinet-ip 03-api-leads 04-research 05-ops-deploy 06-telegram-bot; do
  cp -r projects/$p ~/Projects/bez-it-$p
  cd ~/Projects/bez-it-$p && git init && git add -A && git commit -m "initial import from contour-chat-v17"
  gh repo create <org>/bez-it-$p --private --push --source=.
  cd -
done
```

## Контур ответственности

- **ИП Сапрыкина Е.В.** — владелец лендинга, приём заявок, квалификация, распределение.
- **НПК «Оборон-Экран»** (СПб) — исполнитель по ИБ, КИИ, аттестации ФСТЭК, СКЗИ (лицензия ФСБ разработка ПП-313, пп. 1–6).
- **ООО «Центр Информационных Технологий»** (Москва) — СКУД, видеонаблюдение, ИТ-аутсорсинг, 1С, лицензия ФСБ № Л051-00105-00/00591744/Н от 02.08.2022.
