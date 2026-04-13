# Release blockers и решения

## Уже найденные блокеры

### 1. Live ≠ main
На сервере сейчас активен git branch:
`project/signalum-voice-foundation-20260410`

Это значит:
- live контур живёт не на `main`
- source of truth и server baseline сейчас разошлись

### 2. Два deploy workflow на push main
Активны:
- `deploy-jino-main.yml`
- `deploy-jino-fastlane.yml`

Это противоречит принципу:
- один deploy path
- один production-like baseline

### 3. BASELINE.lock и doctor.sh противоречат друг другу
`doctor.sh` требует `RULE_SINGLE_DEPLOY_PATH=true`,
но в текущем `deploy/BASELINE.lock` этот флаг не подтверждён.

### 4. deploy/ перегружен переходными скриптами
Там смешаны:
- канонические deploy-файлы
- smoke/verify/recovery/runtime parity
- временные и переходные helper-скрипты

### 5. Серверное дерево грязное
Есть untracked мусор:
- `.env.bak.*`
- `.env.fixdb.bak.*`
- `support_bundle_*`

## Что уже решено как канонический курс
1. Не возвращаться в messenger-first как active baseline.
2. Активный канон — room-based V17.
3. Не плодить новые боевые ветки внутри production baseline.
4. Не чинить снова доступы и nginx как первую задачу.
5. Следующий слой — governance cleanup + parity + release.

## Жёсткий порядок действий
1. Merge governance-пакета (#12)
2. Merge hardened deploy (#11)
3. Выключение legacy push-deploy workflows
4. После этого — решение судьбы PR #13 как фактического live foundation
5. Потом — final release hardening и voice acceptance