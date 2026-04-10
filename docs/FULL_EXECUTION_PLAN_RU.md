# Полный план действий по active baseline `room-based-v17`

## Цель
Довести active baseline до состояния, в котором:
- schema parity не требует ручной импровизации;
- deploy/release прогоняются одной канонической цепочкой;
- runtime модули восстанавливаются точечно, а не через хаотичный reset;
- следующий цикл работ идёт уже в cleanup frontend и UX, а не в аварийный recovery.

## Этап 1. Baseline discipline
Статус: выполнено.

Что входит:
- один baseline;
- один deploy path;
- `deploy/BASELINE.lock`;
- `doctor.sh`;
- `deploy.sh`;
- `rollback.sh`.

## Этап 2. SQL parity foundation
Статус: выполняется.

Что входит:
- additive SQL-слои `014`, `015`, `016`, `017`;
- запрет на возврат legacy `013` в active baseline;
- безопасный backfill без разрушения связей.

Критерий готовности:
- не падают `auth`, `rooms`, `voice`, `meetings`, `admin`, `profiles/system/invitations` из-за отсутствующих таблиц/колонок.

## Этап 3. Release fastpath
Статус: выполняется.

Что входит:
- `runtime_parity_apply_and_check.sh`;
- `release_parity_and_smoke.sh`;
- `smoke_api.sh`;
- runbook для полной и короткой цепочки релиза.

Критерий готовности:
- один запуск подтверждает doctor + SQL + runtime parity + smoke + post-check.

## Этап 4. Module recovery fastpath
Статус: запланирован.

Что входит:
- отдельный helper для точечной проверки модулей `auth`, `rooms`, `voice`, `meetings`, `admin`, `me`;
- быстрый вывод того, какой слой упал, без полного redeploy.

Критерий готовности:
- recovery можно делать не по памяти, а по канонической команде.

## Этап 5. Docs/code alignment
Статус: выполняется.

Что входит:
- bootstrap-документы без битых ссылок;
- отдельные reality-note документы там, где код ещё монолитный;
- порядок SQL и release зафиксирован текстом.

Критерий готовности:
- новый чат может поднять проект по репо без ложной карты.

## Этап 6. Frontend cleanup
Статус: не начат.

Что входит:
- декомпозиция `frontend/src/App.jsx`;
- вынос shell, room pages, voice, meeting, admin в отдельные слои;
- сохранение active канона без смены продукта.

Критерий готовности:
- frontend не монолитный и поддаётся сопровождению.

## Этап 7. Release acceptance
Статус: частично выполнен.

Что входит:
- smoke по API;
- внешний health-check;
- ручная браузерная проверка shell;
- ручная проверка голоса и комнаты собрания.

Критерий готовности:
- baseline подтверждён не только кодом, но и живым пользовательским сценарием.

## Правило исполнения
Пока этапы 2-4 не закрыты, нельзя уходить в новый scope. Сначала parity, release, recovery. Только потом frontend cleanup и UX polish.
