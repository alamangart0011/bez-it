# Priority 2 implementation spec — meeting / admin

## Цель

После выравнивания shell/dashboard/voice довести meeting и admin center до операционного product-first уровня, не ломая уже живой room-based runtime.

## 1. Meeting room

### Что убрать
- плоскую простыню блоков
- журнал и второстепенные формы на первом экране
- визуальную перегрузку действий ведущего

### Что оставить
- статус собрания
- ведущего
- участников
- повестку
- материалы
- итог

### Что переписать
- meeting room в tab model
- отдельный первый сценарный экран для ведущего
- журнал и материалы как вторые уровни, а не как шум на старте

### Критерий приёмки
- meeting room читается как отдельный рабочий режим
- ведущий не теряется в интерфейсе
- действия собрания не ломают room runtime

### Прирост
- meeting UX: +18–28 п.п.

---

## 2. Admin overview

### Что убрать
- экран, зависящий от полного счастья всех widget и таблиц
- декоративные summary без пользы

### Что оставить
- live runtime summary
- rooms summary
- incidents / operator summary
- быстрые переходы

### Что переписать
- overview в диспетчерскую администратора
- graceful degradation: один виджет не валит весь экран

### Критерий приёмки
- overview открывается как рабочий центр контроля
- данные полезны даже при частично пустом operator contour

### Прирост
- admin overview: +20–30 п.п.

---

## 3. Admin users / rooms / departments / invitations / sessions / system / audit

### Что убрать
- длинные формы как основной режим
- архивный шум в обычной выдаче
- ощущение тестовой заготовки

### Что оставить
- users
- rooms
- departments
- invitations
- sessions
- system
- audit

### Что переписать
- users/rooms/departments в operational panels
- archive/debug только по фильтру
- audit в компактный журнал с фильтрами и drill-down
- system screen на safe defaults

### Критерий приёмки
- админский центр выглядит единым и зрелым
- можно управлять системой без перехода в отдельный тех-контур

### Прирост
- admin layer: +10–18 п.п.

---

## После закрытия priority 2

Ожидаемый общий процент:
- 84%+ -> 88%+

Ожидаемый рост по блокам:
- admin / operator: 74% -> 84%+
- UI / UX polish: 62%+ -> 74%+
- overall: 84%+ -> 88%+
