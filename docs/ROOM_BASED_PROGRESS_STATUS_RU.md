# Room-based V17 — статус и блокеры

## Активный канон

- baseline: `room-based-v17`
- root: `/opt/messenger/contour-chat-jino-final`
- домен: `https://ai.voice.oboron-it.ru`
- продуктовый вектор: room-based workspace, без возврата в messenger-first

## Текущее подтверждённое состояние

- `api/db/web` подняты
- `health/live/ready/release` отвечают
- логин администратора работает
- `api/me`, `api/rooms`, `api/admin/rooms` отвечают
- сообщения в текстовой комнате читаются и пишутся
- voice state отвечает
- активные комнаты сведены к каноническому набору: `Общий контур`, `Голосовой контур`, `Зал собраний`

## Процент по блокам

- baseline discipline / single contour: 96%
- runtime / deploy contour: 90%
- auth / sessions: 88%
- rooms / chat runtime: 85%
- voice / meetings runtime: 78%
- admin center / operator layer: 74%
- schema parity / migration hygiene: 68%
- UI / UX polish: 46%

Общая готовность: 78%

## Что ещё не закрыто

### P0
- финальный browser acceptance по voice и meeting на живом домене
- вычистить migration-layer от исторического хвоста и ad hoc backfill
- довести admin/runtime до graceful degradation там, где часть виджетов зависит от соседних таблиц

### P1
- скрыть debug/service strip по умолчанию
- убрать тестовый и архивный мусор из обычного пользовательского режима
- ужать voice и meeting экраны до product-first сценария
- перевести admin screens из длинных форм в операционные панели

### P2
- mobile minimum / PWA
- release hardening после живого acceptance

## Следующий практический ход

1. Прогнать `scripts/room_based_acceptance_smoke.sh` на baseline
2. Пройти browser voice/meeting acceptance по HTTPS
3. Снять остаточные P0 ошибки по schema/runtime
4. Перейти в UI cleanup и product polish
