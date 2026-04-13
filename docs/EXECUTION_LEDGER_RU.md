# Execution ledger — room-based V17 baseline

## Правило ведения

Каждый следующий полезный шаг дописывать сюда, а не начинать новый разгон в чате.

---

## 2026-04-13 / baseline discipline
- подтверждён канон: только room-based V17 baseline
- messenger-first зафиксирован как legacy/reference
- active root: `/opt/messenger/contour-chat-jino-final`
- active domain: `https://ai.voice.oboron-it.ru`

## 2026-04-13 / single contour runtime
- очищен active набор комнат до 3 канонических: `Общий контур`, `Голосовой контур`, `Зал собраний`
- `health/live/ready/release` подтверждены
- `api/me`, `api/rooms`, `api/admin/rooms` подтверждены
- message POST/GET подтверждены
- voice state подтверждён

## 2026-04-13 / automation hardening
- добавлен `scripts/room_based_acceptance_smoke.sh`
- добавлен `docs/ROOM_BASED_PROGRESS_STATUS_RU.md`
- добавлен `docs/NEXT_CHAT_CONTINUATION_LOCK_RU.txt`

## Следующий обязательный шаг
- прогнать browser voice/meeting acceptance по HTTPS
- снять остаточные P0 schema/runtime ошибки, если они всплывут именно в browser acceptance
- перейти в P1 UI cleanup по зафиксированному room-based курсу
