# Frontend cleanup execution для active baseline

## Цель
Перевести `frontend/src/App.jsx` из монолитного состояния в управляемую структуру без смены активного продуктового канона.

## Что делаем
### Этап 6.1. Опорные shared-слои
Создаём файловую основу для:
- branding defaults;
- runtime constants;
- shell layout map;
- feature segmentation.

### Этап 6.2. Поэтапный вынос из `App.jsx`
Порядок выноса:
1. branding и константы;
2. shell/state labels;
3. room/voice/meeting helpers;
4. admin helpers;
5. composable UI-блоки.

### Этап 6.3. Wiring
После появления shared-файлов и feature-контуров `App.jsx` начинает импортировать их вместо хранения всего в одном файле.

## Что запрещено
- не создавать второй active frontend;
- не менять baseline `room-based-v17`;
- не делать декоративную модульность без следующего wiring-шага.

## Минимальный критерий прогресса
Stage 6 считается начатым только если в репо уже есть:
- execution doc;
- shared/frontend cleanup files;
- runtime wiring targets.
