# FRONTEND WHITEPATCH MATRIX

## 1. Назначение

Эта матрица фиксирует, как монолитный `frontend/src/App.jsx` должен быть разложен по целевым модулям.

## 2. Матрица переноса

| Источник в монолите | Что внутри | Целевой путь | Статус whitepatch |
|---|---|---|---|
| `App.jsx` / design tokens | цвета, тени, базовые фоновые значения | `frontend/src/shared/ui/tokens.js` | описано |
| `App.jsx` / branding texts | app name, short name, descriptor, footer | `frontend/src/shared/branding/defaults.js` | описано |
| `App.jsx` / runtime values | storage key, reconnect, polling, toast duration | `frontend/src/shared/runtime/constants.js` | описано |
| `App.jsx` / formatters | `fmtT`, `fmtD`, `fmtPhone` | `frontend/src/shared/lib/formatters.js` | описано |
| `App.jsx` / normalizers | `nu`, `nm` | `frontend/src/shared/lib/normalizers.js` | описано |
| `App.jsx` / request layer | `tok`, `req`, `A.*` | `frontend/src/shared/api/base.js` | описано |
| `App.jsx` / room split | text, voice, meeting rooms | `frontend/src/shared/rooms/collections.js` | описано |
| `App.jsx` / message grouping | continuation and date dividers | `frontend/src/shared/messages/grouping.js` | описано |
| `App.jsx` / voice helpers | voice/meeting detection, membership checks | `frontend/src/shared/voice/helpers.js` | описано |
| `App.jsx` / ui primitives | `Tooltip`, `IBtn`, `Btn`, `Inp`, `Modal` | `frontend/src/shared/ui/primitives.jsx` | описано |
| `App.jsx` / auth page | login, phone, qr entry | `frontend/src/features/auth/AuthPage.jsx` | описано |
| `App.jsx` / main app shell | global state and orchestration | `frontend/src/features/shell/MainShell.jsx` | описано |
| `App.jsx` / sidebar block | server rail, room lists, footer panel | `frontend/src/features/sidebar/Sidebar.jsx` | описано |
| `App.jsx` / room main viewport | room header and viewport assembly | `frontend/src/features/rooms/RoomViewport.jsx` | описано |
| `App.jsx` / message block | message rows and message area | `frontend/src/features/messages/MessageList.jsx` | описано |
| `App.jsx` / composer | textarea and send actions | `frontend/src/features/composer/Composer.jsx` | описано |
| `App.jsx` / members panel | right panel and grouped members | `frontend/src/features/members/MembersPanel.jsx` | описано |
| `App.jsx` / overlay | floating voice window | `frontend/src/features/overlay/VoiceOverlay.jsx` | описано |
| `App.jsx` / modals | create room, add member, room settings, profile | `frontend/src/features/modals/ModalsRoot.jsx` | описано |
| `App.jsx` / command palette | cmd+k overlay and actions | `frontend/src/features/command-palette/CommandPalette.jsx` | описано |
| `App.jsx` / root bootstrap | loading, auth switch, main switch | `frontend/src/App.jsx` | описано |

## 3. Что должно исчезнуть из App.jsx

После реального переноса в `App.jsx` не должно остаться:
- inline design tokens
- inline branding defaults
- inline request layer
- inline formatters
- inline normalizers
- inline message grouping
- inline room collections
- inline voice helpers
- большие inline UI-компоненты
- полный feature UI первого уровня

## 4. Что должно остаться в App.jsx

В `App.jsx` должно остаться только:
- import shared и feature модулей
- загрузка stored token
- запрос `api.me(...)`
- переключение `loading/auth/main`
- `AuthPage`
- `MainShell`
- `handleAuth`
- `handleLogout`

## 5. Минимальный критерий успешной разгрузки

Разгрузка считается достаточной, если:
- размер `App.jsx` сокращен кратно
- в `App.jsx` нет бизнес-логики shared-слоя
- feature-компоненты реально импортируются
- старый монолитный код не дублируется во втором месте

## 6. Привязка к текущему whitepatch

Использовать вместе с файлами:
- `docs/FRONTEND_WHITEPATCH_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_SHARED_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_APP_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART1_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART2_RU.md`
- `docs/FRONTEND_WHITEPATCH_CODE_FEATURES_PART3_RU.md`
- `docs/FRONTEND_WHITEPATCH_APPLY_ORDER_RU.md`
