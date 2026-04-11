# PR13 final action block

## Цель
Закрыть PR #13 до состояния runtime-ready preview без возврата к foundation и без расползания scope.

## Последовательность

### Блок 1. Switch existing entrypoints
Применить:
- `patches/runtime-web-switch.patch`

Результат:
- existing `rooms/calls` pages/views/adapters` указывают на runtime-wired `*-next` слой.

### Блок 2. Preview mount
Применить:
- `patches/runtime-preview-nginx.patch`

Результат:
- у preview появляется внешний путь `/runtime-preview`.

### Блок 3. Cleanup
Пройти по:
- `docs/WEB_RUNTIME_CLEANUP_PASS_RU.md`

Результат:
- metadata-only дубль больше не основной authority.

### Блок 4. Preview build/start
Пройти по:
- `docs/WEB_RUNTIME_PREVIEW_DEPLOY_RU.md`

Результат:
- `apps/web` preview contour поднят.

### Блок 5. Visual smoke
Пройти по:
- `docs/WEB_RUNTIME_VISUAL_SMOKE_RU.md`

Результат:
- `rooms/calls/transcript/assistant` подтверждены как единый runtime-driven web flow.

## Final acceptance
PR #13 можно считать закрытым на этой фазе, когда:
- existing entrypoints переключены;
- cleanup завершён;
- `/runtime-preview` работает;
- visual smoke пройден;
- root не тронут.
