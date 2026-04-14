# FRONTEND PREVIEW OPS FASTPATH

Цель: быстро включить room-based preview ops page и сразу проверить, что он готов к открытию через `?preview=1`.

## Последовательность

```bash
bash deploy/apply_room_based_preview_ops_page.sh
```

## Что делает fastpath

1. включает `App.preview.jsx` на `SignalumRoomBasedPreviewOpsPage.jsx`;
2. проверяет, что ops page действительно активен;
3. прогоняет `scripts/preview_ops_page_smoke.sh`;
4. печатает URL для открытия preview режима.

## Ожидаемый результат

```text
[OK] preview ops page applied
[INFO] open http://127.0.0.1:8080/?preview=1
```

## Откат

```bash
bash bin/restore_room_based_preview_ops_page.sh
```

## Когда использовать

- для тестирования preview shell с runtime widgets и actions;
- перед показом нового UI-слоя;
- перед ручной врезкой preview bridge в основной `App.jsx`.
