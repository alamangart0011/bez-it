# Project state lock — 2026-04-13

## Active canon
- only active product canon: room-based V17 baseline
- only active repo/branch layer for control and continuation: `ops/single-contour-cleanup-20260413`
- active PR: `#14`
- only baseline root on Jino: `/opt/messenger/contour-chat-jino-final`
- only active domain: `https://ai.voice.oboron-it.ru`

## What is already fixed
- single-contour course is fixed
- preview and nested release logic are deprecated as active course
- room-based baseline is locked as the only product direction
- continuation/config/ledger/progress/priority specs are already committed in this branch
- artifact index, action sheet, acceptance runbooks, cleanup backlogs, and priority 1/2/3 specs are already committed in this branch

## What is considered done in practice
- core runtime and deploy contour are no longer the main blocker
- the project is no longer in zero state or architecture search mode
- the next work is not product pivot, but focused continuation inside the same baseline

## Main unfinished blocks
1. product-first shell/dashboard/voice cleanup on the real frontend contour
2. meeting/admin cleanup after priority 1
3. stabilization and release hardening after priority 2
4. live browser acceptance of voice/meeting on the domain
5. Bitrix24 integration only as a separate next contour, not as a reason to break the room-based baseline

## Critical prohibitions
- do not switch back to messenger-first as active product direction
- do not create a second active contour
- do not restart discovery from zero
- do not create a new product pivot
- do not replace the room-based model with a personal messenger model
- do not spread status only across chat; keep it in repository docs and PR checkpoint comments

## Current working percentages
- overall active domain project: 81%
- baseline / discipline: 96%
- runtime / deploy: 90%
- auth / sessions: 88%
- rooms / chat runtime: 85%
- voice / meetings runtime: 78%
- admin / operator: 74%
- schema / migration hygiene: 68%
- UI / UX polish: 46%

## Immediate execution order
1. keep the room-based baseline locked
2. continue from priority 1: shell / dashboard / voice
3. then priority 2: meeting / admin
4. then priority 3: stabilization / release hardening
5. keep GitHub docs and PR comments in sync with real progress
