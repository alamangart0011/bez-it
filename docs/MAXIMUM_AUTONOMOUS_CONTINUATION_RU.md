# Maximum autonomous continuation — room-based V17

## Смысл этого файла

Этот файл фиксирует, как проект продолжается **максимально автономно** без повторных вопросов, без нового product pivot и без выхода за границы активного результата.

Он нужен, чтобы execution шёл до предела текущего контура, а остановка происходила только там, где нужен новый live/browser факт.

---

## Что можно продолжать автономно без паузы

### 1. Source-of-truth слой
Можно и нужно автономно продолжать:
- execution docs;
- acceptance docs;
- cleanup backlog;
- merge/apply queue;
- runbook / smoke / post-check;
- PR checkpoints;
- execution ledger append.

### 2. Frontend integration слой
Можно и нужно автономно продолжать:
- shared layer apply;
- bootstrap rewrite of `App.jsx`;
- minimum feature layer merge;
- cleanup монолита и debug/service drift;
- shell/dashboard/voice cleanup sequence.

### 3. Runtime / schema closure слой
Можно и нужно автономно продолжать:
- фиксировать P0 schema/runtime backlog;
- добавлять compatibility runbooks;
- уточнять browser acceptance path;
- дополнять smoke sequence и signoff layer.

### 4. Product cleanup слой
Можно и нужно автономно продолжать:
- убирать техношум;
- убирать test/demo мусор;
- усиливать room-based first screens;
- переводить meeting/admin в operational form;
- ужимать dangerous actions до второго уровня.

---

## Где проходит потолок автономности

Автономное продолжение доходит до предела в одной точке:

**живой browser acceptance на `https://ai.voice.oboron-it.ru`.**

До этого момента можно автономно продолжать:
- docs;
- queue;
- runbooks;
- code-level apply plan;
- PR-level control layer.

После этого момента для честного движения процентов нужен хотя бы один новый факт из:
- живого browser test;
- live domain behaviour;
- role-based acceptance;
- voice / meeting execution result.

---

## Жёсткая автономная последовательность

### Блок A. Control layer
1. держать один baseline;
2. держать один deploy path;
3. фиксировать каждый новый source-of-truth в PR;
4. не открывать новый scope.

### Блок B. Frontend apply
1. Queue A — shared first;
2. Queue B — entry rewrite;
3. Queue C — minimum feature layer;
4. Queue D — cleanup.

### Блок C. First screens
1. shell cleanup;
2. dashboard dispatcher rewrite;
3. voice first-screen compression.

### Блок D. Second wave
1. meeting cleanup;
2. admin cleanup;
3. audit/system operational readability.

### Блок E. Stabilization
1. deploy/apply_sql/smoke/post-check sequence;
2. browser acceptance runbook;
3. stabilization only by real findings.

---

## Что запрещено даже в автономном режиме

Нельзя:
- возвращать messenger-first как active direction;
- плодить новые release-ветки;
- строить второй active contour;
- снова начинать архитектурный поиск;
- повышать проценты по одним документам;
- подменять execution очередным общим планом.

---

## Что считать реальным автономным прогрессом

Реальный автономный прогресс — это только одно из следующего:
- новый source-of-truth файл;
- новый execution/runbook/smoke/checklist файл;
- новый PR checkpoint;
- новый merge/apply queue;
- новый acceptance matrix;
- новый live/browser/runtime факт.

---

## Формула продолжения

Дальше проект продолжается так:

**максимально автономно делать всё, что усиливает уже выбранный room-based результат, и останавливаться только там, где без нового live/browser факта нельзя честно двигать проект дальше.**
