# P0 schema/runtime backlog — room-based V17

## Назначение

Фиксировать только те проблемы, которые способны снова валить живой baseline или ломать browser acceptance.

## Формат

- endpoint / экран
- вероятная таблица или слой
- риск
- что считать закрытием

---

## 1. `/api/me` и профильный контур

### Вероятный слой
- `user_profiles`
- `user_settings`
- `departments`

### Риск
- пустой shell или 500 в личном контуре
- профиль и настройки отображаются как незавершённые или ломают зависимые страницы

### Критерий закрытия
- `/api/me`, `/api/me/settings`, `PATCH /api/me`, `PUT /api/me/settings` работают стабильно
- отсутствие profile/settings строк не валит основной runtime

---

## 2. `/api/admin/overview`

### Вероятный слой
- `room_incidents`
- `system_settings`
- агрегирующие запросы operator / launch layer

### Риск
- overview валится полностью
- admin center выглядит сломанным даже при живом runtime

### Критерий закрытия
- overview загружается даже при пустых operator-таблицах
- один проблемный widget не валит весь экран

---

## 3. `/api/admin/users`

### Вероятный слой
- `departments`
- `invitations`
- связанный profile lookup

### Риск
- users screen не открывается
- невозможно управлять людьми и ролями

### Критерий закрытия
- users screen отдаёт базовый список пользователей
- отсутствие department или invitation записей не валит endpoint

---

## 4. `/api/admin/invitations`

### Вероятный слой
- `invitations`

### Риск
- invitation flow мёртв
- нельзя честно принять внешний access lifecycle как готовый

### Критерий закрытия
- список приглашений открывается
- пустая таблица приглашений не даёт 500
- создание и чтение приглашения проходит

---

## 5. `/api/admin/system`

### Вероятный слой
- `system_settings`

### Риск
- брендинг и системные настройки неуправляемы
- shell теряет единый источник бренда и системных параметров

### Критерий закрытия
- system screen открывается
- при пустой таблице поднимается дефолтное безопасное состояние

---

## 6. `/api/admin/incidents`

### Вероятный слой
- `room_incidents`
- `room_incident_events`

### Риск
- operator layer неполный
- обзор инцидентов или fastpath-действия ломают admin center

### Критерий закрытия
- incidents screen открывается
- пустой incidents contour не валит runtime

---

## 7. `/api/voice/rooms/:id/state` и browser voice flow

### Вероятный слой
- `voice_participants`
- voice state mapping
- browser media / permission layer

### Риск
- server-side state зелёный, а browser acceptance мёртв
- ложное ощущение готовности голоса

### Критерий закрытия
- browser join/mute/unmute/leave проходят на домене
- live room state не ломается после выхода

---

## 8. `/api/rooms/:id` и meeting room detail

### Вероятный слой
- `meetings`
- `meeting_events`
- `room_members`

### Риск
- meeting room открывается частично или валится на деталях
- правый контекст комнаты не собирается полностью

### Критерий закрытия
- room detail работает для text / voice / meeting
- отсутствие meeting rows не даёт критического сбоя для text room

---

## 9. Migration hygiene

### Вероятный слой
- parity sql
- backfill sql
- compatibility triggers

### Риск
- повторный прогон миграций снова ломает baseline
- релиз зависит от исторических ad hoc fixed состояний

### Критерий закрытия
- релизный SQL-прогон больше не форсит опасные backfill-сценарии
- основной room-based baseline не конфликтует с legacy messenger-first хвостом

---

## Приоритет закрытия

1. browser voice acceptance
2. `/api/me` и profile/settings
3. `/api/admin/overview`
4. `/api/admin/system`
5. `/api/admin/users`
6. `/api/admin/invitations`
7. `/api/admin/incidents`
8. meeting room detail
9. migration hygiene
