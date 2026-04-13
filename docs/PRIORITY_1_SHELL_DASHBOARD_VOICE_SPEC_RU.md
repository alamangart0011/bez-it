# Priority 1 implementation spec — shell / dashboard / voice

## Цель

Закрыть главный визуальный и сценарный дефицит live-домена: пользователь должен сразу видеть рабочую оболочку и полезную информацию, а не технический шум или недособранные экраны.

## 1. Shell

### Что убрать
- debug/service strip
- release/service/connection шум в обычном режиме
- визуальную шелуху в brand area

### Что оставить
- room tree
- рабочий центр
- right context
- compact profile block

### Что переписать
- header в плотный продуктовый формат
- нижний profile block в corporate compact block
- empty states в ясные рабочие сообщения

### Критерий приёмки
- shell не пустой
- shell читается как продукт за 3–5 секунд
- нет технического шума в user mode

### Прирост
- shell / UI: +12–18 п.п.

---

## 2. Dashboard

### Что убрать
- self-description сборки
- пустые summary карточки
- debug/release copy

### Что оставить
- активные комнаты
- голосовые сейчас
- собрания
- заявки на вход
- инциденты
- быстрые переходы

### Что переписать
- dashboard в диспетчерскую
- короткий product copy
- быстрые блоки действий вместо длинных описаний

### Критерий приёмки
- пользователь видит рабочую картину дня сразу после входа
- на домене появляется полезная информация

### Прирост
- dashboard: +35–45 п.п.

---

## 3. Voice room

### Что убрать
- перегруженный первый экран
- dangerous mass actions на первом уровне
- длинные участники-карточки

### Что оставить
- статус комнаты
- one-click join
- participants first
- devices
- compact moderator controls

### Что переписать
- compact voice layout
- operator actions во второй уровень
- participant cards в operational mini-cards

### Критерий приёмки
- сотрудник быстро понимает, как войти и кто в комнате
- модератор получает всё нужное без перегрузки first screen

### Прирост
- voice UX: +20–30 п.п.

---

## После закрытия priority 1

Ожидаемый общий процент:
- 78% -> 84%+

Ожидаемый рост по блокам:
- voice / meetings runtime: 78% -> 82%+
- UI / UX polish: 46% -> 62%+
- overall: 78% -> 84%+
