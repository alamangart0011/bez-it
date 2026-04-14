# PORTAL UNIFIED CONTRACT

## 1. Что это за проект

Единый активный продукт — голосовой портал `ai.voice.oboron-it.ru` на room-based baseline.

Рабочий контур:
- один baseline;
- один deploy path;
- один production-like root: `/opt/messenger/contour-chat-jino-final`;
- один активный домен: `https://ai.voice.oboron-it.ru`;
- активная GitHub-ветка продолжения: `ops/single-contour-cleanup-20260413`.

Это не новый продукт и не новый pivot.
Это доведение уже существующего портала до сильного рабочего состояния.

## 2. Что уже есть

Уже подтверждено:
- active room-based runtime живой;
- continuity/runbook/hardening слой уже лежит в репозитории;
- `App.room.jsx` — живой room-based runtime слой;
- preview fileset уже собран;
- preview ops page уже собран;
- apply/check/smoke/restore/state-collector уже собраны как отдельный operational layer;
- browser acceptance и release hardening уже оформлены как runbook и scripts.

Уже лежит в ветке:
- `frontend/src/App.room.jsx`
- `frontend/src/App.preview.jsx`
- `frontend/src/preview/*`
- `deploy/apply_preview_full_stack.sh`
- `deploy/restore_preview_full_stack.sh`
- `scripts/check_preview_full_stack.sh`
- `scripts/collect_preview_full_stack_state.sh`
- `scripts/preview_bridge_smoke.sh`
- `scripts/preview_ops_page_smoke.sh`

## 3. Что должно быть в итоге

Портал должен быть доведён до состояния, где:
- после входа пользователь видит полезный shell, а не пустой runtime;
- dashboard, room, voice, meeting, admin работают как единая система;
- все эти экраны питаются живыми API, а не декоративной статикой;
- preview может быть безопасно включён и безопасно откатан;
- apply/check/smoke/restore/state-collector работают как единый контур;
- browser acceptance проходит повторяемо;
- release hardening не даёт разваливать live-контур;
- GitHub остаётся source of truth;
- каждый законченный этап можно быстро применить на VPS.

## 4. Что сейчас главный блокер

Главный блокер уже не сервер и не deploy path.
Главный блокер сейчас:
- финальный bridge существующего `frontend/src/App.jsx` к preview/full-stack слою;
- дожимка live-bind поведения preview shell;
- доведение preview до состояния production bridge, а не отдельного макета.

## 5. Что нельзя делать

Запрещено:
- возвращаться к старым продуктовым разворотам;
- плодить новые baseline и новые deploy path;
- держать preview как отдельный декоративный мир;
- плодить параллельные entry points без жесткого основания;
- делать новый redesign без связи с действующим runtime;
- считать работу законченной без browser acceptance;
- ломать active root `/opt/messenger/contour-chat-jino-final` временными экспериментами.

## 6. Приоритеты работ

### Приоритет 1
- финальный bridge для `frontend/src/App.jsx`;
- полноценный preview full stack;
- live-bind для shell/actions/widgets;
- browser acceptance;
- release hardening.

### Приоритет 2
- cleanup дубликатов;
- cleanup legacy entry points;
- усиление observability и state collection;
- усиление ops/deploy слоя.

### Приоритет 3
- product polish;
- UX cleanup;
- расширение admin/ops widgets;
- дополнительные интеллектуальные сценарии только после стабилизации ядра.

## 7. Единый порядок исполнения

1. Зафиксировать текущее состояние в GitHub
2. Дожать frontend bridge
3. Дожать live-bind preview shell
4. Применить preview full stack
5. Проверить preview full stack
6. Открыть `?preview=1`
7. Прогнать browser acceptance
8. Собрать state archive
9. Если всё хорошо — считать этап пригодным к live-применению
10. Перейти к следующему этапу

## 8. Правило внедрения

Правило одно:
**этап сделан → сразу apply path → smoke/check → открыть на VPS → только потом следующий этап**

Базовые команды слоя:

```bash
bash deploy/apply_preview_full_stack.sh
bash scripts/check_preview_full_stack.sh
bash scripts/collect_preview_full_stack_state.sh
bash deploy/restore_preview_full_stack.sh
```

Preview URL:

```text
https://ai.voice.oboron-it.ru/?preview=1
```

## 9. Что считать готовностью этапа

Этап считается закрытым только если одновременно выполнено:
- код зафиксирован в active branch;
- есть apply path;
- есть check/smoke path;
- есть restore path;
- есть короткий runbook;
- можно открыть результат через live или local preview URL;
- шаг не ломает active baseline.

## 10. Как работать в этом чате дальше

В этом чате активен режим полноценной разработки портала.
Каждый следующий ответ должен:
1. коротко давать результат;
2. показывать, что изменено;
3. обновлять прогресс по этапам в процентах;
4. показывать следующий этап;
5. считать GitHub живым контуром;
6. считать VPS целевой точкой применения каждого завершённого этапа.
