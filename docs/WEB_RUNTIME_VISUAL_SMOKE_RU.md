# Web runtime visual smoke

## Цель
Подтвердить, что новый runtime-wired web contour для `rooms/calls` реально работает после switch и mount на `/runtime-preview`.

## Проверка

### 1. Preview root
- открыть `/runtime-preview/`
- убедиться, что root рендерится без 5xx

### 2. Rooms
- открыть rooms entry
- увидеть список комнат
- увидеть active room
- увидеть messages timeline
- увидеть members panel
- убедиться, что правая панель не пустая

### 3. Calls
- открыть calls entry
- увидеть current call header
- увидеть participant grid
- увидеть controls
- увидеть transcript panel
- открыть assistant panel

### 4. Transcript
- transcript должен приходить как runtime-backed section
- summary/chunks должны быть связаны с runtime payload

### 5. Assistant
- assistant должен приходить как runtime-backed section
- answer/actionItems/nextSteps должны быть видимы как runtime payload

### 6. Regression
- старый live/root contour не должен ломаться
- не должно быть возврата к metadata-only authority

## Acceptance
Smoke считается пройденным, когда rooms/calls/transcript/assistant работают внутри `/runtime-preview` как единый runtime-driven web flow.
