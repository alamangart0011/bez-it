# Priority 1 execution lock — shell / dashboard / voice

## Статус документа

Этот файл фиксирует **следующий обязательный execution layer** поверх уже созданных priority-docs.

Он не открывает новый product analysis и не меняет канон.

Активный контракт:
- только room-based V17 baseline;
- только один active root: `/opt/messenger/contour-chat-jino-final`;
- только один active domain: `https://ai.voice.oboron-it.ru`;
- только одна GitHub-ветка продолжения: `ops/single-contour-cleanup-20260413`;
- messenger-first не возвращается как основной интерфейс;
- meeting/admin идут **после** shell/dashboard/voice;
- проценты не пересчитываются без нового live/browser/runtime факта.

---

## Что считать полезным изменением в рамках Priority 1

Полезным действием считается только одно из следующего:
- реальное изменение frontend-кода shell/dashboard/voice;
- новый source-of-truth файл, который сокращает потерю контекста и напрямую влияет на execution path;
- новый acceptance/checklist/runbook, привязанный к live-домену или browser acceptance;
- новый live/browser/runtime факт по `https://ai.voice.oboron-it.ru`;
- новый cleanup-факт по shell/dashboard/voice.

Не считать полезным действием:
- повторный анализ продукта;
- повторное обсуждение room-based vs messenger-first;
- новые параллельные ветки, preview-контуры, nested releases;
- длинные общие планы без execution sequence.

---

## Жёсткая последовательность Priority 1

### Шаг 1. Shell cleanup lock

#### Убрать
- debug/service strip из обычного user mode;
- service/release/connectivity шум из first screen;
- лишнюю служебную шелуху в brand area;
- недособранные mini-blocks, не влияющие на room navigation.

#### Оставить
- room tree;
- main workspace;
- right context;
- compact profile block;
- product header без техношумов.

#### Критерий готовности
- shell читается как продукт за 3–5 секунд;
- shell не выглядит RC-стендом;
- пользователь не видит debug/runtime-strip в обычном режиме.

#### Что фиксировать после закрытия
- какой strip/блок скрыт или удалён;
- какой header/profile block уплотнён;
- скрин или live-browser факт.

---

### Шаг 2. Dashboard dispatcher rewrite

#### Убрать
- self-description сборки;
- release/debug copy;
- пустые summary cards;
- длинные пояснения вместо действий.

#### Оставить
- активные комнаты;
- голосовые сейчас;
- собрания;
- заявки на вход;
- инциденты;
- быстрые переходы;
- короткий product copy.

#### Критерий готовности
- после логина пользователь сразу видит рабочую картину дня;
- dashboard стал диспетчерской, а не стендом сборки;
- на live-домене есть полезные сущности, а не проектный текст.

#### Что фиксировать после закрытия
- какие блоки убраны;
- какие operational widgets оставлены;
- какой live/browser факт подтверждён.

---

### Шаг 3. Voice first-screen compression

#### Убрать с первого уровня
- dangerous mass actions;
- длинные участники-карточки;
- операторскую перегрузку;
- длинные текстовые простыни.

#### Оставить на первом уровне
- статус комнаты;
- `Войти в голос`;
- participants first;
- devices;
- compact moderator path.

#### Перенести на второй уровень
- mass moderation;
- operator actions;
- queue/entry control details;
- incident-heavy controls.

#### Критерий готовности
- сотрудник понимает экран за 3–5 секунд;
- вход в голос делается без лишних шагов;
- модератор не теряет нужные действия, но first screen перестаёт быть перегруженным.

#### Что фиксировать после закрытия
- что скрыто во второй уровень;
- что осталось на первом;
- browser fact по входу в голос на live-домене.

---

## Что идёт сразу после Priority 1

Без отклонений:
1. meeting cleanup;
2. admin cleanup;
3. stabilization / release hardening.

Priority 2 не открывать до тех пор, пока не выполнены одновременно:
- shell cleanup;
- dashboard rewrite;
- voice first-screen compression;
- хотя бы один новый live/browser факт по домену.

---

## Правило фиксации статуса

После каждого реального полезного изменения фиксировать кратко и одинаково:
- что сделано;
- что дальше;
- какой новый факт подтверждён;
- процент писать только если появился новый реальный live/runtime/browser факт.

Фиксация обязательна:
- в чате;
- в docs/PR контуре.

---

## Запреты

Нельзя:
- перезапускать product pivot;
- возвращать messenger-first как main interface;
- плодить новые release-ветки;
- строить второй active contour;
- уводить внимание с shell/dashboard/voice до закрытия Priority 1.

---

## Definition of done для Priority 1

Priority 1 считается реально закрытым только если одновременно есть:
- обновлённый frontend-контур shell/dashboard/voice;
- отражение изменений в docs / PR checkpoint;
- новый browser/live факт по `https://ai.voice.oboron-it.ru`;
- отсутствие техношумов на first screens;
- voice first screen переведён в compact corporate mode.
