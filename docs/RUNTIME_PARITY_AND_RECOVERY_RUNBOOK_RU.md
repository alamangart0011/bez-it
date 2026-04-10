# Runtime parity и recovery runbook

## Цель
Этот runbook нужен для active baseline `room-based-v17`, чтобы прогонять релиз предсказуемо: один baseline, один deploy path, один порядок действий.

## Когда использовать
Использовать в трёх случаях:
1. после вливания новой редакции в `main`;
2. после ручного обновления baseline на сервере;
3. после падения runtime, когда надо быстро подтвердить SQL parity, health и smoke.

## Канонический порядок
1. `./deploy/doctor.sh`
2. `./deploy/apply_sql.sh`
3. `./deploy/runtime_parity_apply_and_check.sh`
4. `./scripts/smoke_api.sh http://127.0.0.1:3001`
5. ручной браузерный smoke по домену

## Что проверяет каждый шаг
### 1. doctor
Проверяет single-baseline discipline, наличие `deploy/BASELINE.lock`, отсутствие вложенных legacy-каталогов и базовую готовность production-root.

### 2. apply_sql
Прогоняет все SQL-файлы из `infra/sql/` по порядку. Для active baseline важно, что `013_legacy_schema_parity.sql` уже отправлен в карантин логикой deploy-слоя и не должен ломать схему `room-based-v17`.

### 3. runtime parity
Проверяет:
- `/api/health`
- `/api/release`
- `/api/live`
- `/api/ready`
- что защищённые runtime-endpoints требуют авторизацию;
- что legacy-endpoints возвращают `410`, а не оживают случайно.

### 4. smoke_api
Подтверждает минимальный контракт public runtime:
- `health`
- `live`
- `ready`
- `release`
- корректный `404`-контракт.

### 5. браузерный smoke
Подтверждает реальное пользовательское поведение:
- вход;
- загрузку shell;
- открытие текстовой комнаты;
- открытие голосовой комнаты;
- открытие комнаты собрания;
- базовые admin-экраны.

## Минимальный чек после выкладки
- `docker compose ps` без crash-loop;
- `api`, `db`, `web` healthy;
- `/api/health` отвечает `200`;
- `/api/release` показывает ожидаемые baseline/release данные;
- `scripts/smoke_api.sh` заканчивается `[OK]`;
- UI не пустой;
- комнаты видны;
- voice state читается без 500.

## Если упало на SQL parity
1. Не переключать baseline.
2. Не заводить новую release-ветку.
3. Снять логи `docker compose logs api db --tail=150`.
4. Проверить, не упёрлось ли в schema drift по сущностям:
   - `room_members`
   - `user_profiles`
   - `departments`
   - `invitations`
   - `system_settings`
   - `room_incidents`
   - `voice_participants`
   - `meetings`
5. Чинить только additive SQL-слоем следующего номера.

## Если упало на runtime, а SQL прошёл
1. Проверить `backend/src/server.js` и `backend/src/routes/*`.
2. Проверить `/api/release` и `/api/health`.
3. Снять `docker compose logs api --since=5m`.
4. Если упал только один модуль admin/voice/profile, чинить его schema/service слой, не трогая baseline целиком.

## Что запрещено
- возвращать `messenger-first` как active baseline;
- плодить новые вложенные production-каталоги;
- заменять `room-based-v17` новым каноном без миграционного плана;
- лечить schema drift ручными ad-hoc SQL-командами без фиксации в `infra/sql/`.
