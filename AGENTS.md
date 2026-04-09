# AGENTS.md

## Repo
contour-chat-v17

## Product
Контур — корпоративная система голосовой связи, координации, комнат, собраний и операторского управления.

## Active canon
- room-based V17 baseline
- /opt/messenger/contour-chat-jino-final
- https://ai.voice.oboron-it.ru
- one baseline
- one deploy path
- Russian-only UI

## Truth
- active baseline and latest runtime facts only
- messenger-first / V25 = legacy/reference only

## Work mode
- narrow steps only
- no restart from zero
- no messenger-first pivot
- no wide refactor
- no empty UI
- every step must include smoke and rollback
- commit after each green step

## Current priority
1. P1 transport fix
2. admin/operator hardening
3. release stabilization
