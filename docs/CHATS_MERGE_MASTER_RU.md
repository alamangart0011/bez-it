# Chats Merge Master

Дата фиксации: 2026-04-10
Ветка: `room-based-v17`
Источник истины: GitHub
Статус: `merge-ready / whitepatch-assembled`

## 1. Главный канон
- active baseline: `room-based-v17`
- GitHub = главный источник истины
- messenger-first не является активным каноном
- deploy path: `/opt/messenger/contour-chat-jino-final`
- domain: `https://ai.voice.oboron-it.ru`

## 2. Что уже собрано в GitHub
### Статусный слой
- `docs/CHAT3_STATUS_RU.md`
- `docs/ACCEPTANCE_STATUS_RU.md`
- `docs/HANDOFF_STATUS_RU.md`
- `docs/HANDOFF_INDEX_RU.md`
- `docs/CHAT3_EXECUTION_BOARD_RU.md`
- `docs/CHAT3_STATUS_MANIFEST_RU.json`

### Canonical whitepatch слой
- `docs/README_CANONICAL_CHAT3_RU.md`
- `docs/CHANGELOG_CANONICAL_RU.md`
- `docs/LATEST_STATE_CANONICAL_CHAT3_RU.md`
- `docs/REPO_MAP_CANONICAL_CHAT3_RU.md`
- `docs/PATHS_CANONICAL_CHAT3_RU.md`
- `docs/BOOT_CHECKLIST_CANONICAL_CHAT3_RU.md`
- `docs/DECISIONS_CANONICAL_CHAT3_RU.md`
- `docs/ONE_PROMPT_CANONICAL_CHAT3_RU.txt`
- `docs/NEW_CHAT_SCENARIOS_CANONICAL_CHAT3_RU.md`
- `docs/TASK_MODES_CANONICAL_CHAT3_RU.json`

### Whitepatch transfer слой
- `docs/WHITEPATCH_GITHUB_TRANSFER_RU.md`
- `docs/WHITEPATCH_MANIFEST_RU.json`
- `docs/WHITEPATCH_STATUS_SUMMARY_RU.json`
- `docs/WHITEPATCH_CONTROL_RU.md`
- `docs/WHITEPATCH_VERIFICATION_RU.md`
- `docs/FINAL_TRANSFER_BRIEF_RU.md`
- `docs/FINAL_SYNC_STATUS_RU.md`
- `docs/TRANSFER_READY_STATE_RU.md`
- `docs/NEXT_CHAT_WHITEPATCH_BRIEF_RU.md`
- `docs/HANDOFF_SYNC_STATUS_RU.md`

### Проверка и перенос
- `docs/TRACKED_REWRITE_PLAN_RU.md`
- `docs/TRACKED_REWRITE_MAPPING_RU.json`
- `docs/LIVE_ACCEPTANCE_STATUS_RU.md`
- `docs/LIVE_ACCEPTANCE_CHECKPOINTS_RU.md`
- `docs/HANDOFF_CLOSE_PLAN_RU.md`

### Дополнительный automation слой
- `docs/README_AUTOMATION_SUPPLEMENT_RU.md`
- `docs/CHANGELOG_AUTOMATION_SUPPLEMENT_RU.md`

## 3. Что ещё не закрыто
### Tracked files rewrite
Нужно физически переписать существующие tracked-файлы содержимым canonical overlays:
- `README.md` <- `docs/README_CANONICAL_CHAT3_RU.md`
- `CHANGELOG_RU.md` <- `docs/CHANGELOG_CANONICAL_RU.md`
- `docs/LATEST_STATE_RU.md` <- `docs/LATEST_STATE_CANONICAL_CHAT3_RU.md`
- `docs/REPO_MAP_RU.md` <- `docs/REPO_MAP_CANONICAL_CHAT3_RU.md`
- `docs/PATHS_AND_ENTRYPOINTS_RU.md` <- `docs/PATHS_CANONICAL_CHAT3_RU.md`
- `docs/BOOT_CHECKLIST_RU.md` <- `docs/BOOT_CHECKLIST_CANONICAL_CHAT3_RU.md`
- `docs/DECISION_RULES_RU.md` <- `docs/DECISIONS_CANONICAL_CHAT3_RU.md`
- `docs/ONE_PROMPT_ANY_CHAT_RU.txt` <- `docs/ONE_PROMPT_CANONICAL_CHAT3_RU.txt`
- `docs/NEW_CHAT_SCENARIOS_RU.md` <- `docs/NEW_CHAT_SCENARIOS_CANONICAL_CHAT3_RU.md`
- `docs/TASK_MODES_RU.json` <- `docs/TASK_MODES_CANONICAL_CHAT3_RU.json`

### Live acceptance
Нужно подтвердить на живом домене:
- voice room
- meeting room
- moderator actions
- summon / move user
- admin overview / users / rooms / system / invitations / incidents

### Финальный close
- после tracked rewrite обновить основной документный слой
- после live acceptance закрыть handoff sync
- затем переходить к песочнице и SSH

## 4. Остаток работ
- документный whitepatch: собран
- tracked rewrite: pending
- live acceptance: pending
- final handoff close: pending

Итоговый остаток: 3 критических шага.

## 5. Что должен делать следующий объединённый чат
1. Считать этот файл главным входом.
2. Считать GitHub единственным центром текущего состояния.
3. Сначала закрыть tracked rewrite.
4. Потом закрыть live acceptance.
5. Потом делать перенос в песочницу и SSH-этап.
