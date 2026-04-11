# Web runtime patch map

## Что видно по текущему head

### Уже runtime-aware
- `apps/web/src/runtime/page-runtime-adapter.ts`
- `apps/web/src/runtime/runtime-execution-index.ts`
- `apps/web/src/runtime/rooms-runtime-execution.ts`
- `apps/web/src/runtime/calls-runtime-execution.ts`
- `apps/web/src/runtime/transcript-runtime-execution.ts`
- `apps/web/src/runtime/assistant-runtime-execution.ts`
- `apps/web/src/flow/rooms-call-runtime.ts`

### Пока в основном декларативные / схемные
- `apps/web/src/pages/rooms-page.ts`
- `apps/web/src/pages/calls-page.ts`
- `apps/web/src/views/rooms-view.ts`
- `apps/web/src/views/calls-view.ts`
- `apps/web/src/views/transcript-view.ts`
- `apps/web/src/views/assistant-view.ts`
- `apps/web/src/adapters/rooms-page-adapter.ts`
- `apps/web/src/adapters/calls-page-adapter.ts`
- `apps/web/src/loaders/rooms-loader.ts`
- `apps/web/src/loaders/calls-loader.ts`
- `apps/web/src/shell/content-shell.ts`
- `apps/web/src/shell/right-panel-shell.ts`
- `apps/web/src/shell/room-shell.ts`
- `apps/web/src/shell/call-shell.ts`
- `apps/web/src/config/navigation.ts`
- `apps/web/src/config/right-panels.ts`

## Реальная цель patch-пакета
Перевести `rooms / calls / transcript / assistant` из декларативной схемы в runtime-driven UI path без возврата к foundation.

## Файл-за-файлом

### 1. `apps/web/src/pages/rooms-page.ts`
Нужно:
- сделать page entry не только metadata-описанием,
- а точкой запуска `executeRoomsPage` как основного источника state.

Результат:
- `rooms` page получает runtime state и viewModel,
- а не только runtime description.

### 2. `apps/web/src/pages/calls-page.ts`
Нужно:
- сделать page entry не только metadata-описанием,
- а точкой запуска `executeCallsPage`.

Результат:
- `calls` page получает runtime state/viewModel,
- а transcript/assistant binding живет рядом, а не отдельно.

### 3. `apps/web/src/views/rooms-view.ts`
Нужно:
- принять runtime state как вход,
- связать `roomHeader`, `messageList`, `composer`, `membersPanel` с `rooms.state` и `rooms.viewModel`.

Результат:
- view становится runtime-driven,
- sections больше не висят как чистая схема.

### 4. `apps/web/src/views/calls-view.ts`
Нужно:
- принять runtime state как вход,
- привязать `callHeader`, `participantGrid`, `controls`, `transcriptPanel` к `calls`, `transcript`, `assistant` flow.

Результат:
- calls view становится точкой живого runtime UI,
- а transcriptPanel получает реальный hydrated payload.

### 5. `apps/web/src/views/transcript-view.ts`
Нужно:
- сажать view на `executeTranscriptPanel`,
- подать chunks/summary/counters в `rightPanelShell`.

Результат:
- transcript panel живет не как отдельная декларация,
- а как runtime section с реальными данными.

### 6. `apps/web/src/views/assistant-view.ts`
Нужно:
- сажать view на `executeAssistantPanel`,
- подать answer/actionItems/nextSteps/counters в правую панель.

Результат:
- assistant panel становится живой частью calls/rooms-call flow.

### 7. `apps/web/src/adapters/rooms-page-adapter.ts`
Нужно:
- перестать быть только mapping-описанием,
- стать переходником между runtime payload и room-shell model.

Результат:
- adapters начинают реально адаптировать state,
- а не только описывать binding/state/dto/loaders.

### 8. `apps/web/src/adapters/calls-page-adapter.ts`
Нужно:
- сделать то же для `calls`:
- currentCall, participants, devices, transcriptMode, assistantMode.

### 9. `apps/web/src/loaders/rooms-loader.ts`
Нужно:
- либо перевести в thin-wrapper поверх runtime execute,
- либо оставить только как legacy metadata, но перестать использовать как основной путь.

### 10. `apps/web/src/loaders/calls-loader.ts`
Нужно:
- сделать то же для `calls`.

### 11. `apps/web/src/flow/rooms-call-runtime.ts`
Нужно:
- сделать главным chained execution flow для рабочего сценария `rooms -> calls -> transcript -> assistant`.
- закрепить его как product flow, а не только runtime utility.

### 12. `apps/web/src/flow/rooms-call-flow.ts`
Нужно:
- синхронизировать transitions с реальным runtime chain.
- если flow остается чисто декларативным, не дублировать runtime-логику.

### 13. `apps/web/src/shell/room-shell.ts`
Нужно:
- привязать sections к runtime state:
  - `roomHeader` <- `rooms.viewModel.title/subtitle`
  - `messageList` <- `rooms.state.messages`
  - `composer` <- room actions
  - `membersPanel` <- `rooms.state.members`

### 14. `apps/web/src/shell/call-shell.ts`
Нужно:
- привязать sections к runtime state:
  - `callHeader` <- `calls.viewModel.title/subtitle`
  - `participantGrid` <- `calls.state.participants`
  - `controls` <- `calls.state.devices` и runtime actions
  - `transcriptPanel` <- transcript runtime payload

### 15. `apps/web/src/shell/right-panel-shell.ts`
Нужно:
- сделать runtime-aware маршрутизацию секций `members/files/pins/assistant/transcript`.
- transcript и assistant должны открываться не как пустые секции, а как hydrated panels.

### 16. `apps/web/src/shell/content-shell.ts`
Нужно:
- научить shell принимать page execution result как источник зон `pageHeader/mainContent/composer/timeline`.

### 17. `apps/web/src/config/right-panels.ts`
Нужно:
- проверить соответствие фактическим runtime sections.
- не держать секции, которые не подкреплены реальным runtime binding.

### 18. `apps/web/src/config/navigation.ts`
Нужно:
- проверить, что `/rooms` и `/calls` ведут в runtime-driven path,
- а не только в схемный page descriptor.

## Порядок правок
1. `rooms-page.ts`
2. `calls-page.ts`
3. `rooms-view.ts`
4. `calls-view.ts`
5. `transcript-view.ts`
6. `assistant-view.ts`
7. `rooms-page-adapter.ts`
8. `calls-page-adapter.ts`
9. `room-shell.ts`
10. `call-shell.ts`
11. `right-panel-shell.ts`
12. `content-shell.ts`
13. `rooms-loader.ts`
14. `calls-loader.ts`
15. `rooms-call-flow.ts`
16. `config/right-panels.ts`
17. `config/navigation.ts`
18. cleanup

## Cleanup checklist
- убрать дубли old hydrate-only path, если runtime execute уже основной;
- не оставлять параллельную логику в adapters/loaders/flow;
- не держать transcript/assistant как пустые секции;
- не возвращаться к server/runtime foundation;
- после cleanup перейти в deployable `apps/web` preview contour.

## Критерий готовности
Patch-map считается реализованным, когда:
- `rooms` и `calls` страницы реально питаются от execution result;
- transcript и assistant реально живут в правой панели и/или chained flow;
- shell получает runtime state, а не только schema metadata;
- loaders/adapters/flow очищены от пустого дублирования;
- после этого можно собирать `/runtime-preview` contour.
