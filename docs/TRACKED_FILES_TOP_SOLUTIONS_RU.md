# Top solutions for each tracked file

## 1. README.md
Топ-решение: заменить основное содержимое на `docs/README_CANONICAL_CHAT3_RU.md`, а automation-блок добавить из `docs/README_AUTOMATION_SUPPLEMENT_RU.md`.
Что это даёт: один канонический вход в проект + слой automation без потери baseline.
Чем проверять: совпадение active baseline, deploy path, domain и source of truth.

## 2. CHANGELOG_RU.md
Топ-решение: заменить основное содержимое на `docs/CHANGELOG_CANONICAL_RU.md`, automation-блок добавить из `docs/CHANGELOG_AUTOMATION_SUPPLEMENT_RU.md`.
Что это даёт: единый changelog без разрыва между bootstrap и automation.
Чем проверять: наличие room-based-v17, GitHub-first и pending-блока.

## 3. docs/LATEST_STATE_RU.md
Топ-решение: заменить содержимое на `docs/LATEST_STATE_CANONICAL_CHAT3_RU.md`.
Что это даёт: реальный current-state без старых расхождений.
Чем проверять: baseline, deploy path, domain, acceptance/handoff status.

## 4. docs/REPO_MAP_RU.md
Топ-решение: заменить содержимое на `docs/REPO_MAP_CANONICAL_CHAT3_RU.md`.
Что это даёт: актуальная карта репо с overlay-слоем и whitepatch-контуром.
Чем проверять: root/docs/overlay sections.

## 5. docs/PATHS_AND_ENTRYPOINTS_RU.md
Топ-решение: заменить содержимое на `docs/PATHS_CANONICAL_CHAT3_RU.md`.
Что это даёт: короткая и точная карта точек входа.
Чем проверять: deploy, sql, backend, frontend entry.

## 6. docs/BOOT_CHECKLIST_RU.md
Топ-решение: заменить содержимое на `docs/BOOT_CHECKLIST_CANONICAL_CHAT3_RU.md`.
Что это даёт: новый чат стартует только от актуального слоя.
Чем проверять: порядок чтения и confirm baseline/domain/overlays.

## 7. docs/DECISION_RULES_RU.md
Топ-решение: заменить содержимое на `docs/DECISIONS_CANONICAL_CHAT3_RU.md`.
Что это даёт: убирает расхождения по active canon и handoff discipline.
Чем проверять: GitHub-first, room-based-v17, handoff after sync.

## 8. docs/ONE_PROMPT_ANY_CHAT_RU.txt
Топ-решение: заменить содержимое на `docs/ONE_PROMPT_CANONICAL_CHAT3_RU.txt`.
Что это даёт: единый стартовый prompt для объединённого чата.
Чем проверять: baseline, source of truth, порядок чтения, status-first.

## 9. docs/NEW_CHAT_SCENARIOS_RU.md
Топ-решение: заменить содержимое на `docs/NEW_CHAT_SCENARIOS_CANONICAL_CHAT3_RU.md`.
Что это даёт: сценарии status/recovery/release/handoff/code без хаоса.
Чем проверять: наличие пяти режимов и правильного порядка действий.

## 10. docs/TASK_MODES_RU.json
Топ-решение: заменить содержимое на `docs/TASK_MODES_CANONICAL_CHAT3_RU.json`.
Что это даёт: машинно-читаемый task-mode слой для нового чата.
Чем проверять: status/recovery/release/handoff/code + baseline + source_of_truth.

## Лучший порядок применения
1. README.md
2. CHANGELOG_RU.md
3. docs/LATEST_STATE_RU.md
4. docs/REPO_MAP_RU.md
5. docs/PATHS_AND_ENTRYPOINTS_RU.md
6. docs/BOOT_CHECKLIST_RU.md
7. docs/DECISION_RULES_RU.md
8. docs/ONE_PROMPT_ANY_CHAT_RU.txt
9. docs/NEW_CHAT_SCENARIOS_RU.md
10. docs/TASK_MODES_RU.json

## Лучший способ применения
- использовать low-level git rewrite path;
- брать source content строго из canonical overlays;
- после rewrite перечитать каждый tracked-файл из `room-based-v17`;
- затем закрыть live acceptance и final handoff sync.
