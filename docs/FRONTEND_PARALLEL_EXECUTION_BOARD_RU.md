# FRONTEND PARALLEL EXECUTION BOARD

Текущий параллельный контур работ по frontend bridge и room-based preview.

## 1. Preview Bridge Layer
- preview fileset: готово
- runtime hook: готово
- visual shell: готово
- preview flags: готово
- action helpers: в работе
- update existing `App.jsx`: стоппер коннектора, обходной путь уже подготовлен

## 2. Scripts / Apply Path
- `bin/enable_room_based_preview_bridge.sh`: готово
- `bin/check_room_based_preview_bridge.sh`: готово
- `bin/restore_room_based_preview_bridge.sh`: готово
- `scripts/preview_bridge_smoke.sh`: готово
- `deploy/apply_room_based_preview_bridge.sh`: готово

## 3. Documentation
- preview bridge guide: готово
- preview fileset guide: готово
- merge sequence: готово
- bridge runbook: готово
- parallel execution board: этот файл

## 4. Next Live Binding Steps
- привязать кнопки preview shell к live actions
- подключить admin overview / invitations / incidents в quick blocks
- перевести voice controls на runtime actions
- дожать bridge в `App.jsx` через apply-path

## 5. Execution Rule
Работа идёт одновременно по трём фронтам:
1. preview bridge
2. server/deploy apply-path
3. фиксация статуса и sequence в PR и docs
