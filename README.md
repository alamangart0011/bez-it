# CorpChat V17 — этапы 0–7

Эта редакция собрана поверх последнего сильного baseline без создания новой параллельной release-ветки внутри production-корня.

## Что сделано

### Этап 0. Baseline / release discipline
- зафиксирован один baseline через `deploy/BASELINE.lock`;
- добавлены `deploy/doctor.sh`, `deploy/deploy.sh`, `deploy/rollback.sh`;
- обновлён smoke-сценарий;
- добавлена отдельная документация `docs/STAGE0_RELEASE_DISCIPLINE_RU.md`.

### Этап 1. Русский UI и shell
- оболочка очищена от английских текстов;
- добавлены тёмная тема по умолчанию и светлая тема как опция;
- усилены левая и правая панели;
- добавлен отдельный маршрут и экран для комнаты собраний;
- центр администратора переименован и собран в единый экран.

### Этап 2. Доступ, восстановление, приглашения и сессии
- работает вход с access/refresh lifecycle;
- access token дополнительно проверяется по активной server-side сессии;
- добавлены forgot password и reset password;
- добавлен первый вход по приглашению администратора;
- добавлена страница активных сессий и журнала входов.

### Этап 3. Профили и настройки
- профиль сотрудника вынесен в отдельный модуль;
- добавлены `user_profiles`, `user_settings`, `departments`;
- настройки уведомлений, внешнего вида, голоса и доступности работают как отдельный пользовательский контур.

### Этап 4. Роли, права и guard'ы
- введена матрица ролей и прав;
- backend и frontend согласованы по permission guard;
- русские ошибки и доступ к админскому разделу нормализованы.

### Этап 5. Chat UX
- добавлены поиск по комнате, date separators и unread marker;
- работают reply, edit, delete, pin и upload;
- выведены файлы комнаты и закрепы рядом с composer.

### Этап 6. Voice UX + meetings
- добавлены `voice_participants`, `meetings`, `meeting_events`;
- голосовая комната показывает сотрудников, роли, статусы, руку, mute/deafen и screen share;
- доступны действия модерации и перенос участника между голосовыми комнатами;
- комната для собраний получила повестку, ведущего, журнал событий, материалы и итоговый блок.

## Стендовые данные
- логин: `admin@corpchat.local`
- пароль: `admin123`
- демонстрационный токен приглашения: `invite_demo_stage2_2026`

## Документация
- `docs/STAGE0_RELEASE_DISCIPLINE_RU.md`
- `docs/STAGE1_RUSSIAN_SHELL_RU.md`
- `docs/STAGE2_ACCESS_AND_SESSIONS_RU.md`
- `docs/STAGE3_PROFILE_SETTINGS_RU.md`
- `docs/STAGE4_ROLES_PERMISSIONS_RU.md`
- `docs/STAGE5_6_CHAT_VOICE_MEETINGS_RU.md`

### Этап 7. Единый центр администратора и cleanup
- отдельная административная вкладка в том же shell;
- управление пользователями, ролями, отделами, комнатами и приглашениями;
- системные параметры бренда, лицензионного пакета и подписи shell;
- архивирование комнат вместо хаотичного удаления;
- отдельный SQL-шаг `infra/sql/003_stage7_admin_center.sql` для existing baseline.

## Документация этапа 7
- `docs/STAGE7_ADMIN_CENTER_AUTOMATION_RU.md`

## Следующий цикл
Дальше — финальная полировка, стабилизация и предрелизный контроль боевого контура.

## Финальный хостинговый пакет
- `deploy/jino_one_command.sh` — единая команда для Jino baseline;
- `deploy/post_deploy_check.sh` — быстрый пост-деплой прогон;
- `docs/JINO_FINAL_DEPLOY_RU.md` — краткий runbook выкладки;
- `docs/GO_LIVE_CHECKLIST_RU.md` — go-live список перед понедельничным запуском.


## Operations hardening

- `deploy/backup_db.sh` — резервная копия PostgreSQL.
- `deploy/restore_db.sh <file.sql.gz>` — восстановление дампа PostgreSQL.
- `deploy/collect_logs.sh` — сбор логов `api/web/db` перед разбором инцидента.
- `/api/live`, `/api/ready`, `/api/health`, `/api/release` — рабочие точки для runtime-диагностики.
