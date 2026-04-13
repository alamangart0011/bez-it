# Autodeploy to VPS mode — room-based V17

## Режим

Дальше проект должен восприниматься так:
- не как набор ручных действий;
- не как несколько контуров;
- не как серия preview-выкладок;
- а как **один baseline с одним автоматическим deploy path на VPS**.

Активный путь один:
- root: `/opt/messenger/contour-chat-jino-final`
- domain: `https://ai.voice.oboron-it.ru`
- deploy entrypoint: `./deploy/jino_one_command.sh`

---

## Что означает autodeploy в этом проекте

Autodeploy здесь = любой следующий релевантный пакет или cleanup должен мыслиться как изменение, которое:
1. вливается в один baseline;
2. не создаёт новый preview-контур;
3. не требует второго release-root;
4. прогоняется через один и тот же deploy path.

---

## Каноническая автоматическая цепочка

```text
doctor -> deploy -> apply_sql -> smoke -> post_deploy_check
```

Никакой другой цепочки для active VPS-контурa быть не должно.

---

## Что делать автоматически перед выкладкой

### 1. Проверить baseline lock
- `deploy/BASELINE.lock`
- `RULE_SINGLE_DEPLOY_PATH=true`
- `PREVIEW_DISABLED=true`

### 2. Очистить preview и nested release мусор
- `app-*`
- `preview`
- `runtime-preview`
- `8088`
- nested каталоги `v14+`, `release`, `releases` внутри baseline

### 3. Гнать только один root
- `/opt/messenger/contour-chat-jino-final`

---

## Что делать автоматически после выкладки

### 1. Локальная проверка
- `http://127.0.0.1:8080/api/health`
- `http://127.0.0.1:8080/api/release`

### 2. Внешняя проверка
- `https://ai.voice.oboron-it.ru/api/health`

### 3. Browser acceptance
- shell;
- rooms;
- voice;
- meeting;
- admin.

---

## Что запрещено в autodeploy mode

Нельзя:
- выкладывать в новый параллельный root;
- держать preview-path как активный путь;
- подменять baseline messenger-first веткой;
- выкладывать изменения вне room-based результата;
- считать деплой завершённым без post-check и browser acceptance.

---

## Что считать правильным финалом

Правильное состояние такое:
- один root;
- один домен;
- один deploy entrypoint;
- один room-based baseline;
- все следующие улучшения вливаются в него же.

---

## Рабочее правило

Дальше мыслить проект нужно так:

**если изменение реально нужно, оно не обсуждается как отдельный контур, а сразу готовится к вливанию в один baseline и к прогону через один VPS deploy path.**
