# Whitepatch для переноса всей истории в GitHub

Дата фиксации: 2026-04-10
Ветка: `room-based-v17`
Источник истины: GitHub
Статус: `github-whitepatch / transfer-ready`

## Что уже считается перенесённым в GitHub
- baseline `room-based-v17` закреплён;
- создан статусный слой Chat 3: acceptance, handoff, execution board, manifest, canonical overlays;
- созданы automation supplements для README и changelog;
- GitHub можно использовать как главный узел перед дальнейшим SSH-переносом в песочницу.

## Что осталось довести после whitepatch

### 1. Главные tracked-файлы
Нужно синхронизировать содержимое существующих tracked-файлов с canonical overlay-слоем:
- `README.md`
- `CHANGELOG_RU.md`
- `docs/LATEST_STATE_RU.md`
- `docs/REPO_MAP_RU.md`
- `docs/PATHS_AND_ENTRYPOINTS_RU.md`
- `docs/BOOT_CHECKLIST_RU.md`
- `docs/DECISION_RULES_RU.md`
- `docs/ONE_PROMPT_ANY_CHAT_RU.txt`
- `docs/NEW_CHAT_SCENARIOS_RU.md`
- `docs/TASK_MODES_RU.json`

### 2. Остаток по данным и таблицам
Нужно подтвердить, что на live baseline реально применены и/или не расходятся с кодом следующие сущности:
- `user_profiles`
- `user_settings`
- `departments`
- `invitations`
- `password_reset_tokens`
- `system_settings`
- `room_incidents`
- `room_incident_events`
- `room_members`
- `voice_participants`
- `meetings`
- `meeting_events`
- служебные поля parity для rooms/messages/audit/auth sessions

### 3. Остаток по слоям
Нужно финально подтвердить целостность слоёв:
- deploy / sql parity;
- backend runtime contracts;
- frontend shell/runtime contracts;
- admin center;
- voice / meetings acceptance;
- handoff / release / automation layer.

### 4. Остаток по live acceptance
Нужно отдельно отметить финальный факт по браузерной проверке:
- voice room;
- meeting room;
- moderator actions;
- summon / move user;
- admin overview / users / rooms / system / invitations / incidents.

## Процентная оценка остатка
- документный whitepatch в GitHub: 92%;
- tracked-файлы: pending rewrite;
- live acceptance: pending confirm;
- итоговый остаток до полного документного closure: 8%.

## Что делать после GitHub whitepatch
1. Завершить tracked-file rewrite.
2. Снять live acceptance status по voice / meeting.
3. После этого делать SSH-перенос и runtime-перенос в песочницу.
