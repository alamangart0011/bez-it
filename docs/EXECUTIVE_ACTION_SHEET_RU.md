# Жёсткий исполнительный лист — room-based V17

## Этап 0. Канон и дисциплина

Текущий процент: 96%
Целевой процент после закрытия: 100%

### Убрать
- messenger-first как active UI
- новые параллельные release-ветки
- новый разгон с нуля в следующих чатах

### Оставить
- только room-based V17
- один root
- один deploy path
- один активный домен

### Переписать
- continuation logic для нового чата через lock-файл и ledger

### Критерий приёмки
- любой новый чат продолжает работу только по `docs/NEXT_CHAT_CONTINUATION_LOCK_RU.txt`
- источник истины только `docs/ROOM_BASED_PROGRESS_STATUS_RU.md` и `docs/EXECUTION_LEDGER_RU.md`

---

## Этап 1. P0 runtime / schema parity

Текущий процент: 68%
Целевой процент после закрытия: 92%

### Убрать
- ad hoc recovery как постоянную модель
- ручную угадайку по runtime
- schema drift вокруг room-based контура

### Оставить
- живой baseline
- рабочий auth
- рабочий room/message/voice runtime

### Переписать
- migration hygiene
- parity layer без конфликтов с legacy хвостом
- acceptance smoke как обязательную часть релиза

### Критерий приёмки
- `health/live/ready/release` зелёные
- `api/me`, `api/rooms`, `api/admin/rooms`, `api/rooms/:id/messages`, `api/voice/rooms/:id/state` стабильно отвечают
- acceptance smoke проходит без ручных правок

---

## Этап 2. Browser voice / meeting acceptance

Текущий процент: 78%
Целевой процент после закрытия: 90%

### Убрать
- фальшивый green-state без браузерного подтверждения
- допущение, что server-side voice state равен готовому продукту

### Оставить
- текущий voice/meeting backend
- операторские слои entry/launch/wallboard

### Переписать
- только то, что всплывёт в реальном HTTPS browser flow

### Критерий приёмки
- вход в голос через браузер
- микрофон разрешается
- join/leave работают
- meeting room открывается
- summon/move/moderation не ломают комнату

---

## Этап 3. Shell cleanup

Текущий процент: 46%
Целевой процент после закрытия: 82%

### Убрать
- debug/service strip
- self-description главной страницы
- release/debug шум
- техно-статусы в обычном пользовательском режиме

### Оставить
- room-based shell
- левую навигацию
- правую контекстную панель
- встроенный admin center

### Переписать
- главную в диспетчерскую
- top area в product-first header
- profile block в компактный corporate вид

### Критерий приёмки
- главный экран показывает только рабочие сущности
- нет служебного шума
- shell читается как продукт, а не как RC-стенд

---

## Этап 4. Rooms / chat polish

Текущий процент: 85%
Целевой процент после закрытия: 90%

### Убрать
- тестовые комнаты
- лишние search/file cards в центре
- постоянные edit/delete/pin actions на первом уровне

### Оставить
- 3 канонические комнаты
- room members
- files/pins/right context

### Переписать
- composer вниз по центру
- hover/menu actions
- компактный room header
- поиск комнаты в header/right panel

### Критерий приёмки
- чат выглядит как рабочая текстовая комната
- сообщение пишется, читается, управляется без визуального мусора

---

## Этап 5. Voice UX cleanup

Текущий процент: 78%
Целевой процент после закрытия: 88%

### Убрать
- перегруженный главный экран голосовой
- массовые опасные действия с первого уровня
- длинные карточки участников

### Оставить
- список участников
- speaking state
- devices
- one-click join
- moderator path

### Переписать
- voice room в compact mode
- operator/moderator actions во второй уровень
- participant cards в короткий operational view

### Критерий приёмки
- обычный сотрудник понимает голосовой экран за 3–5 секунд
- модератор получает все действия, но не перегружает первый экран

---

## Этап 6. Meeting UX cleanup

Текущий процент: 74%
Целевой процент после закрытия: 86%

### Убрать
- плоскую простыню meeting screen
- большой журнал на первом экране
- второстепенные формы без сценарной логики

### Оставить
- ведущего
- статус
- участников
- материалы
- итог

### Переписать
- meeting room в tab model: `Участники`, `Повестка`, `Материалы`, `Журнал`, `Итог`

### Критерий приёмки
- комната собрания читается как отдельный режим, а не как набор форм

---

## Этап 7. Admin center / operator layer

Текущий процент: 74%
Целевой процент после закрытия: 88%

### Убрать
- длинные формы как основной режим
- полный фейл страницы из-за одного widget
- архивный мусор в обычной выдаче

### Оставить
- users
- rooms
- departments
- invitations
- sessions
- audit
- system
- operator launch layer

### Переписать
- users/rooms/departments в operational panels
- overview в настоящую диспетчерскую
- archive/debug только по фильтру

### Критерий приёмки
- админ управляет системой из одного центра
- обычный runtime не захламлён операторским мусором

---

## Этап 8. Mobile minimum / PWA

Текущий процент: 20%
Целевой процент после закрытия: 72%

### Убрать
- desktop-only assumptions
- перегруженные right panels на мобильном
- мелкие hit areas

### Оставить
- тот же канон
- тот же shell
- тот же room-based продукт

### Переписать
- drawer вместо sidebar
- bottom sheet вместо right panel
- sticky voice dock
- installable PWA

### Критерий приёмки
- room/chat/voice/meeting usable на мобильном без поломки UX

---

## Этап 9. Stabilization

Текущий процент: 38%
Целевой процент после закрытия: 95%

### Убрать
- исторический шум migration/recovery
- временные скрипты из активного рабочего контура
- ложные зелёные статусы без acceptance

### Оставить
- только рабочий release path
- только полезные smoke/runbook scripts

### Переписать
- финальный release hardening
- execution ledger как единую историю исполнения

### Критерий приёмки
- один чистый baseline
- один понятный release contour
- один объективный progress snapshot

---

## Итог

- Текущая общая готовность: 78%
- Целевой уровень перед финальным визуальным просмотром: 95%+
