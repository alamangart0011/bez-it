# FRONTEND WHITEPATCH GAP REGISTER

## 1. Текущее состояние whitepatch

Готовность whitepatch-пакета в ветке `chat2-frontend-cleanup`:
- выполнено примерно 95 процентов по документированию и разложению
- выполнено примерно 35 процентов по реальному коду в production paths
- остаток по полной рабочей интеграции примерно 65 процентов

## 2. Что уже закрыто

Закрыто в ветке:
- собран whitepatch overview
- собран shared code whitepatch
- собран app entry whitepatch
- собран feature split whitepatch
- собран apply order
- собрана matrix переноса из монолита в target structure

## 3. Главные gap'ы, которые еще не закрыты реальным кодом

### GAP-01. Реальный rewrite `frontend/src/App.jsx`
Статус:
- описан
- production path еще не переписан полностью

Что не хватает:
- заменить текущий монолитный `App.jsx` новым bootstrap-entry
- убрать inline tokens, api, normalizers, formatters и UI-компоненты

### GAP-02. Shared production files
Статус:
- целевые файлы определены
- production content еще не перенесен полностью

Что не хватает:
- перенести содержимое whitepatch-code в реальные пути `frontend/src/shared/**`
- подтвердить реальные импорты из feature-слоев

### GAP-03. Feature split production files
Статус:
- структура определена
- production files еще не закрыты полностью

Что не хватает:
- реально создать и подключить `features/auth/*`
- реально создать и подключить `features/shell/*`
- реально создать и подключить `features/sidebar/*`
- реально создать и подключить `features/rooms/*`
- реально создать и подключить `features/messages/*`
- реально создать и подключить `features/composer/*`
- реально создать и подключить `features/members/*`
- реально создать и подключить `features/overlay/*`
- реально создать и подключить `features/modals/*`
- реально создать и подключить `features/command-palette/*`

### GAP-04. Branding canon final cleanup
Статус:
- canon описан
- production cleanup еще не завершен

Что не хватает:
- финально унифицировать product naming
- финально унифицировать footer/signature
- убрать все остаточные дрейфы текстов

### GAP-05. Final wiring pass
Статус:
- wiring map описан
- final wiring еще не завершен

Что не хватает:
- заменить все старые inline helper-логики на shared imports
- убедиться, что нет дублей после переноса
- пройти final cleanup `App.jsx`

## 4. Остаток в процентах по реальной интеграции

Примерная декомпозиция остатка:
- rewrite `App.jsx`: 15 процентов
- shared production transfer: 15 процентов
- feature production transfer: 20 процентов
- final wiring cleanup: 10 процентов
- branding final cleanup: 5 процентов

Итого:
- реальный остаток до рабочего frontend whitepatch: примерно 65 процентов

## 5. Что проверять на ближайшей ревизии

Проверить по ветке `chat2-frontend-cleanup`:
1. лежат ли все whitepatch docs
2. перенесен ли shared code в production paths
3. переписан ли `frontend/src/App.jsx`
4. существуют ли реальные feature файлы
5. снят ли branding drift
6. не остался ли второй UI-канон

## 6. Следующий технический шаг

Следующий технический шаг после этого gap register:
- перенести shared code в production paths
- затем полностью переписать `frontend/src/App.jsx`
- затем физически завести feature split первого уровня
