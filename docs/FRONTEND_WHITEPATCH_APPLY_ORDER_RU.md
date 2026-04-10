# FRONTEND WHITEPATCH APPLY ORDER

## 1. Что уже лежит в ветке

Ветка: `chat2-frontend-cleanup`

Уже добавлены документы whitepatch:
- `docs/FRONTEND_WHITEPATCH_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_SHARED_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_APP_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART1_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART2_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART3_RU.md`

## 2. Жесткий порядок применения

### Этап 1. Shared
Сначала перенести в `frontend/src/shared/**`:
- branding defaults
- runtime constants
- ui tokens
- formatters
- normalizers
- api base
- room collections
- message grouping
- voice helpers
- ui primitives

### Этап 2. Entry
После shared перенести новый `frontend/src/App.jsx`.

### Этап 3. Features
После entry перенести feature-слои:
- `features/auth/AuthPage.jsx`
- `features/shell/MainShell.jsx`
- `features/sidebar/Sidebar.jsx`
- `features/rooms/RoomViewport.jsx`
- `features/messages/MessageList.jsx`
- `features/composer/Composer.jsx`
- `features/members/MembersPanel.jsx`
- `features/overlay/VoiceOverlay.jsx`
- `features/command-palette/CommandPalette.jsx`
- `features/modals/ModalsRoot.jsx`

### Этап 4. Wiring cleanup
После переноса файлов:
- убрать дубли helper-логики из старого монолита
- убрать старые inline primitives из `App.jsx`
- убрать старые inline formatters из `App.jsx`
- убрать старые inline normalizers из `App.jsx`
- убрать старые inline room/voice helpers из `App.jsx`
- убрать branding drift и служебные хвосты

## 3. Что должно получиться по структуре

```text
frontend/src/
  App.jsx
  shared/
    branding/defaults.js
    runtime/constants.js
    ui/tokens.js
    ui/primitives.jsx
    lib/formatters.js
    lib/normalizers.js
    api/base.js
    rooms/collections.js
    messages/grouping.js
    voice/helpers.js
  features/
    auth/AuthPage.jsx
    shell/MainShell.jsx
    sidebar/Sidebar.jsx
    rooms/RoomViewport.jsx
    messages/MessageList.jsx
    composer/Composer.jsx
    members/MembersPanel.jsx
    overlay/VoiceOverlay.jsx
    command-palette/CommandPalette.jsx
    modals/ModalsRoot.jsx
```

## 4. Обязательные проверки после переноса

### 4.1. App.jsx
Проверить, что `App.jsx`:
- не содержит дизайн-токены
- не содержит request layer
- не содержит normalizers
- не содержит formatters
- не содержит крупные inline UI-компоненты
- содержит только bootstrap и связку entry-компонентов

### 4.2. Shared
Проверить, что shared:
- реально импортируется из feature-файлов
- не лежит мертвыми файлами
- покрывает старую логику монолита

### 4.3. Features
Проверить, что feature-файлы:
- не тащат обратно shared-логику в себя
- не плодят второй UI-канон
- используют один branding canon

### 4.4. Branding
Проверить, что осталось:
- одно имя продукта
- один footer
- один descriptor
- один цветовой канон

## 5. Критерии приемки

Whitepatch принят, если:
- `App.jsx` заметно разгружен
- shared-слой реально подключен
- feature split первого уровня реально существует
- frontend не раздвоен
- branding drift снят
- структура готова к следующему шагу сборки и runtime-проверки

## 6. Остаток после текущего состояния ветки

Текущее состояние:
- whitepatch docs и кодовые шаблоны уже собраны
- реальный код в production paths еще не влит полностью

Оценка остатка:
- выполнено примерно 35 процентов
- осталось примерно 65 процентов

## 7. Что проверять следующим сообщением

При следующей проверке нужно пройти по пунктам:
1. все ли whitepatch-docs лежат в ветке
2. все ли shared path'ы закрыты кодом
3. закрыт ли новый `App.jsx`
4. закрыт ли feature split первого уровня
5. убран ли старый inline-монолитный мусор
