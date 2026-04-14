# FRONTEND PREVIEW FULL STACK RUNBOOK

Единый порядок работы с room-based preview full stack.

## Включение

```bash
bash deploy/apply_preview_full_stack.sh
```

Что включает:
- preview bridge
- preview ops page
- smoke/check scripts

## Проверка состояния

```bash
bash scripts/check_preview_full_stack.sh
```

## Сбор состояния

```bash
bash scripts/collect_preview_full_stack_state.sh
```

Результат:
- создаётся tar.gz архив со статусом bridge, ops page, smoke и текущими версиями `App.jsx` и `App.preview.jsx`.

## Открытие preview

```text
http://127.0.0.1:8080/?preview=1
```

или

```text
https://ai.voice.oboron-it.ru/?preview=1
```

## Откат

```bash
bash deploy/restore_preview_full_stack.sh
```

## Для чего нужен full stack режим

- проверить новый product-first shell на room-based baseline;
- включить ops page с actions и widgets;
- быстро собрать состояние слоя для handoff, нового чата или incident-review.
