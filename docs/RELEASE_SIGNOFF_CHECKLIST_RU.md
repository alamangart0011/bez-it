# Release sign-off checklist — room-based V17

## A. Канон
- [ ] Активный baseline только room-based V17
- [ ] Один deploy path
- [ ] Messenger-first не активирован как UI
- [ ] Нет новых параллельных release-веток

## B. Runtime
- [ ] `health/live/ready/release` зелёные
- [ ] `api/me` отвечает
- [ ] `api/rooms` отвечает
- [ ] `api/admin/rooms` отвечает
- [ ] message POST/GET проходит
- [ ] voice state отвечает

## C. Browser acceptance
- [ ] Shell открывается без пустого состояния
- [ ] Текстовая комната работает после reload
- [ ] Вход в голос через браузер проходит
- [ ] Meeting room открывается и работает по базовому сценарию
- [ ] Summon / move / moderation не ломают runtime

## D. UI cleanup
- [ ] Debug/service strip скрыт по умолчанию
- [ ] Главная — диспетчерская, а не self-description сборки
- [ ] Тестовый мусор убран из active UI
- [ ] Voice screen ужат до compact mode
- [ ] Meeting room переведён в сценарный режим
- [ ] Admin center не выглядит как набор длинных форм

## E. Data and admin
- [ ] Канонические 3 комнаты подтверждены
- [ ] Архив и active rooms разделены
- [ ] Приглашения открываются без 500
- [ ] System screen живёт на safe defaults
- [ ] Overview не валится от одного widget
- [ ] Audit читается как рабочий журнал

## F. Stabilization
- [ ] Migration-layer не даёт опасных blind backfill
- [ ] Временные recovery-скрипты не являются основным release path
- [ ] Acceptance результаты зафиксированы в execution ledger

## G. Финальный sign-off
Релиз считается подписанным только если:
- пройдены A+B+C
- не осталось незакрытого P0
- P1 cleanup не ломает runtime
