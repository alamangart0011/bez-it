# Каноническая иерархия одного контура

Этот документ фиксирует единственную правильную иерархию проекта после зачистки preview и временных release-контуров.

## 1. Активный кодовый канон

Активным кодовым каноном считается только:

- репозиторий: `alamangart0011/contour-chat-v17`
- baseline: `room-based-v17`
- ветка для рабочего merge: `main`

Никакие отдельные preview-ветки, messenger-first ответвления и вложенные release-каталоги не считаются active product baseline.

## 2. Активный серверный канон

Единственный серверный root:

- `/opt/messenger/contour-chat-jino-final`

Работа на сервере должна вестись только в этом каталоге.

Запрещённые формы дальнейшей эксплуатации:

- `/opt/messenger/contour-chat-jino-final/v14`
- `/opt/messenger/contour-chat-jino-final/v15`
- `/opt/messenger/contour-chat-jino-final/v16`
- `/opt/messenger/contour-chat-jino-final/v17`
- любые `release`, `releases`, `preview`, `runtime-preview`, `app` внутри baseline

## 3. Активный внешний канон

Единственный внешний адрес:

- `https://ai.voice.oboron-it.ru`

Единственная штатная публикация web:

- `8080 -> 80` внутри baseline compose

Временные публикации `8088` и старый preview path считаются техдолгом и должны быть сняты из эксплуатации.

## 4. Канонический deploy path

Допустимый путь выкладки только один:

```bash
cd /opt/messenger/contour-chat-jino-final
./deploy/jino_one_command.sh
```

Он опирается на уже существующие файлы:

- `deploy/doctor.sh`
- `deploy/deploy.sh`
- `deploy/apply_sql.sh`
- `scripts/smoke_api.sh`
- `deploy/post_deploy_check.sh`

## 5. Канонический baseline lock

В `deploy/BASELINE.lock` должны быть одновременно зафиксированы:

```text
BASELINE=room-based-v17
ROOT=/opt/messenger/contour-chat-jino-final
DOMAIN=https://ai.voice.oboron-it.ru
RULE_SINGLE_DEPLOY_PATH=true
PREVIEW_DISABLED=true
```

Если это не так, baseline ещё не нормализован полностью.

## 6. Что считается legacy/reference

Допускается хранить как reference, но не как active runtime:

- handoff-пакеты
- support/control layer документы
- старые release notes
- архивные runtime и migration материалы

Это не должно публиковаться как второй живой контур.

## 7. Критерий окончательной нормализации

Нормализация считается завершённой только когда одновременно верны все условия:

- активен один репозиторий кода;
- активен один server root;
- активен один домен;
- опубликован один web-порт;
- `doctor` подтверждает single deploy path;
- `deploy` проходит без ручных обходов;
- `smoke` и `post_deploy_check` зелёные;
- дальнейшая продуктовая полировка идёт только поверх этого baseline.
