# Test domain audit sequence

## Цель
Проверить, что на тестовом домене preview реально работает как единый runtime-driven web contour.

## Адреса для аудита
- `http://<TEST_DOMAIN>/runtime-preview/`
- `http://<TEST_DOMAIN>/runtime-preview-safe/`

## Последовательность проверки

### 1. Root preview
- открыть `/runtime-preview/`
- убедиться, что есть первый рендер без 5xx
- убедиться, что страница не пустая

### 2. Rooms flow
- открыть rooms
- проверить список комнат
- проверить active room
- проверить timeline/messages
- проверить members panel

### 3. Calls flow
- открыть calls
- проверить call header
- проверить participant grid
- проверить controls

### 4. Transcript and assistant
- открыть transcript panel
- открыть assistant panel
- проверить, что это не пустые заглушки

### 5. Safe fallback
- повторить те же проверки на `/runtime-preview-safe/`

### 6. Regression
- основной root/live contour должен продолжать отвечать отдельно
- preview path не должен ломать root

## Артефакты аудита
Снять:
- root preview
- rooms screen
- calls screen
- transcript panel
- assistant panel
- safe preview root

## Acceptance
Аудит считается успешным, когда оба preview path дают рабочий runtime-driven контур и не ломают основной live path.
