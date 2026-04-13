# Portal finalization endgame — room-based V17

## Назначение

Этот файл фиксирует **конец portal-разработки** в рамках текущего active baseline.

Он нужен, чтобы дальше не расползаться в новые идеи и не спорить о продукте, а дожать существующий room-based портал до состояния live acceptance.

Активный контур не меняется:
- один baseline root: `/opt/messenger/contour-chat-jino-final`;
- один домен: `https://ai.voice.oboron-it.ru`;
- одна ветка продолжения: `ops/single-contour-cleanup-20260413`;
- room-based V17 — единственный активный продуктовый канон.

---

## Конец portal-разработки = что именно должно быть доведено

### 1. Portal shell
Должен давать сразу рабочее ощущение продукта:
- без debug/service strip;
- без release/runtime-copy в user mode;
- с читаемым room tree;
- с плотным product header;
- с компактным профайл-блоком.

### 2. Portal dashboard
Должен стать диспетчерской:
- активные комнаты;
- голосовые сейчас;
- собрания;
- заявки на вход;
- инциденты;
- быстрые переходы.

Не должен оставаться RC-стендом с технотекстом.

### 3. Portal voice
Должен стать главным рабочим модулем:
- first screen = compact corporate mode;
- `Войти в голос` как главный action;
- participants first;
- devices visible;
- dangerous mass actions только на втором уровне.

### 4. Portal meeting/admin
Идут после shell/dashboard/voice:
- meeting в сценарной tab-model;
- admin не валит весь экран из-за одного виджета;
- users/rooms/departments/invitations/sessions/system/audit читаются как operational panels.

### 5. Portal stabilization
После product cleanup:
- deploy -> apply_sql -> smoke -> post_deploy_check;
- browser acceptance на живом домене;
- один короткий stabilization cycle только по live-фактам.

---

## Жёсткая финальная последовательность

### Фаза A. Frontend apply
Довести active frontend contour в безопасном порядке:
1. shared layer;
2. bootstrap-only `App.jsx`;
3. minimum feature layer;
4. cleanup дубликатов и branding drift.

### Фаза B. First screens
Без отклонений:
1. shell;
2. dashboard;
3. voice.

Пока это не закрыто, portal нельзя считать доведённым.

### Фаза C. Browser acceptance
Проверять только на живом домене:
1. вход и shell;
2. текстовая комната;
3. голосовая комната;
4. meeting room;
5. управляемый вход / модерация;
6. admin center.

### Фаза D. Fix loop
Если найден новый P0:
- фиксировать endpoint / роль / экран / шаг воспроизведения;
- чинить точечно;
- не открывать новый product pivot;
- не менять baseline.

---

## Что считать концом portal-разработки

Portal development считается реально доведённой только если одновременно есть:
- shell не пустой и без техношумов;
- dashboard — диспетчерская, а не стенд;
- voice first screen переведён в compact corporate mode;
- живой browser acceptance на `https://ai.voice.oboron-it.ru` пройден хотя бы по базовому сценарию;
- админка не валится целиком при открытии основных разделов;
- статус зафиксирован в docs / PR.

---

## Что запрещено до самого конца

Нельзя:
- возвращать messenger-first как active interface;
- плодить новые release-ветки или preview-контуры;
- открывать новый большой redesign до live acceptance;
- пересчитывать проценты без нового live/browser/runtime факта;
- заменять execution sequence разговорами о другой архитектуре.

---

## Формат фиксации после каждого полезного изменения

Обязательный формат:
- что сделано;
- что дальше;
- какой новый факт подтверждён;
- проценты — только при новом live/browser/runtime факте.

Фиксация обязательна в двух местах:
- в чате;
- в GitHub docs / PR checkpoint.
