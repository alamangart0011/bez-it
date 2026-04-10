# FRONTEND WHITEPATCH

## 1. Статус на текущий момент

Активный baseline: `room-based-v17`.

Источник истины: GitHub repo `alamangart0011/contour-chat-v17`.

Текущее состояние frontend:
- `frontend/src/App.jsx` остается монолитным entrypoint.
- Внутри `App.jsx` смешаны design tokens, branding, API, normalizers, formatters, message grouping, room/voice helpers, bootstrap и UI-компоненты.
- В рабочей ветке `chat2-frontend-cleanup` уже добавлена часть новых frontend-файлов под shared-слой.
- Реальный wiring еще не завершен.

Оценка готовности:
- выполнено примерно 20 процентов
- остаток примерно 80 процентов

## 2. Что уже сделано

В рабочую ветку добавлены заготовки и базовые файлы для cleanup:
- `frontend/src/shared/branding/defaults.js`
- `frontend/src/shared/runtime/constants.js`
- `frontend/src/shared/ui/tokens.js`
- `frontend/src/shared/api/base.js`
- `frontend/src/shared/lib/formatters.js`
- `frontend/src/shared/rooms/kinds.js`
- `frontend/src/shared/rooms/collections.js`
- `frontend/src/shared/messages/grouping.js`

Это не финальная реализация, а стартовый каркас для реального wiring.

## 3. Главный дефицит

Главный дефицит сейчас не в идее и не в структуре, а в том, что:
1. `frontend/src/App.jsx` еще не переписан под shared imports.
2. shared-файлы не наполнены всей реальной логикой из монолита.
3. feature split первого уровня еще не выполнен.
4. branding drift еще не закрыт одним каноном.
5. wiring не завершен и целостность frontend еще не подтверждена.

## 4. Полный остаток работ

### 4.1. Shared слой
Нужно довести до реального кода:
- `frontend/src/shared/branding/defaults.js`
- `frontend/src/shared/runtime/constants.js`
- `frontend/src/shared/ui/tokens.js`
- `frontend/src/shared/lib/formatters.js`
- `frontend/src/shared/lib/normalizers.js`
- `frontend/src/shared/api/base.js`
- `frontend/src/shared/rooms/collections.js`
- `frontend/src/shared/messages/grouping.js`
- `frontend/src/shared/voice/helpers.js`

### 4.2. Rewrite App.jsx
Нужно вынести из `frontend/src/App.jsx`:
- design tokens
- branding defaults
- runtime constants
- formatters
- api base and request layer
- normalizers
- room collection logic
- message grouping logic
- room and voice helper logic

В самом `App.jsx` нужно оставить только:
- bootstrap
- auth entry switch
- main app assembly
- imports новых feature-компонентов и shared-функций

### 4.3. Feature split первого уровня
Нужно выделить как минимум такие модули:
- `frontend/src/features/auth/*`
- `frontend/src/features/shell/*`
- `frontend/src/features/sidebar/*`
- `frontend/src/features/rooms/*`
- `frontend/src/features/messages/*`
- `frontend/src/features/composer/*`
- `frontend/src/features/members/*`
- `frontend/src/features/overlay/*`
- `frontend/src/features/modals/*`
- `frontend/src/features/command-palette/*`

### 4.4. Branding canon
Нужно свести к одному канону:
- одно имя продукта в UI
- один footer
- один descriptor
- один набор цветовых токенов
- убрать дрейф между `Сигнум`, `Контур Связи`, `Signum V17` и служебными хвостами там, где они не нужны

### 4.5. Wiring и cleanup
Нужно:
- заменить локальные helper на shared imports
- убрать дубли логики
- сократить объем `App.jsx`
- проверить, что новые модули реально подключены, а не лежат мертвыми файлами
- вычистить неиспользуемые части после переноса

## 5. Разбивка процента остатка

Остаток 80 процентов делится примерно так:
- shared layer real code: 15 процентов
- rewrite `App.jsx`: 20 процентов
- feature split first level: 25 процентов
- branding canon cleanup: 5 процентов
- wiring and duplicate removal: 10 процентов
- final integrity pass: 5 процентов

## 6. Целевой файл-мэп после whitepatch

### Shared
- `frontend/src/shared/branding/defaults.js`
- `frontend/src/shared/runtime/constants.js`
- `frontend/src/shared/ui/tokens.js`
- `frontend/src/shared/lib/formatters.js`
- `frontend/src/shared/lib/normalizers.js`
- `frontend/src/shared/api/base.js`
- `frontend/src/shared/rooms/collections.js`
- `frontend/src/shared/messages/grouping.js`
- `frontend/src/shared/voice/helpers.js`

### Features
- `frontend/src/features/auth/AuthPage.jsx`
- `frontend/src/features/shell/MainShell.jsx`
- `frontend/src/features/sidebar/Sidebar.jsx`
- `frontend/src/features/rooms/RoomList.jsx`
- `frontend/src/features/messages/MessageList.jsx`
- `frontend/src/features/composer/Composer.jsx`
- `frontend/src/features/members/MembersPanel.jsx`
- `frontend/src/features/overlay/VoiceOverlay.jsx`
- `frontend/src/features/modals/ModalsRoot.jsx`
- `frontend/src/features/command-palette/CommandPalette.jsx`

### Entry
- `frontend/src/App.jsx`

## 7. Порядок реальной сборки whitepatch

Этап 1.
Дозаполнить shared-слой реальным кодом из монолита.

Этап 2.
Переписать `frontend/src/App.jsx` так, чтобы он перестал хранить shared-логику внутри себя.

Этап 3.
Вытащить `AuthPage`, `VoiceOverlay`, `Sidebar`, `RoomList`, `MessageList`, `Composer`, `MembersPanel`, `CommandPalette`, modal-контур.

Этап 4.
Подключить все новые imports и убрать дубли из `App.jsx`.

Этап 5.
Проверить branding canon и добить текстовые расхождения.

## 8. Критерии приемки

Whitepatch считается выполненным, когда:
- `frontend/src/App.jsx` заметно уменьшен
- shared-логика реально живет в `frontend/src/shared/**`
- feature-слои реально подключены
- frontend не раздвоен
- branding drift внутри frontend снят
- код готов к нормальной сборке и сопровождению

## 9. Жесткие запреты

В рамках этого whitepatch нельзя:
- создавать второй frontend
- создавать параллельный UI-канон
- трогать backend без абсолютного blocker
- редактировать `README.md`
- редактировать `CHANGELOG_RU.md`
- редактировать `docs/LATEST_STATE_RU.md`
- редактировать `docs/REPO_MAP_RU.md`
- редактировать `docs/PATHS_AND_ENTRYPOINTS_RU.md`
- редактировать `docs/BOOT_CHECKLIST_RU.md`
- трогать `deploy/**`
- трогать `infra/sql/**`

## 10. Следующий обязательный шаг

Следующий обязательный шаг после этого whitepatch-документа:
- полный rewrite `frontend/src/App.jsx`
- затем сразу feature split первого уровня
