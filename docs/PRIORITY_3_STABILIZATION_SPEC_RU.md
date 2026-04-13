# Priority 3 stabilization and release hardening spec

## Goal

After priority 1 and priority 2, move the room-based V17 baseline from recovery and cleanup mode into a stable product contour.

## 1. Release path

### Remove
- dependence on temporary recovery scripts
- manual guessing around smoke and post-deploy
- green status without acceptance

### Keep
- one deploy path
- release smoke
- post-deploy check
- room-based acceptance smoke

### Rewrite
- one clear release contour
- sign-off only after browser acceptance and with no open P0

### Acceptance criteria
- release uses one path
- acceptance and sign-off match the real state

---

## 2. Migration hygiene

### Remove
- risky blind backfill
- legacy messenger-first tail that conflicts with room-based baseline
- ad hoc parity as a permanent operating model

### Keep
- only safe compatibility layers
- only needed room-based parity steps

### Rewrite
- migration layer into a cleaner and more predictable release contour

### Acceptance criteria
- repeated release run does not create a new P0
- room-based baseline does not conflict with legacy structure

---

## 3. Execution discipline

### Remove
- status spread across chat
- context loss between iterations

### Keep
- continuation lock
- execution ledger
- progress snapshot
- artifact index

### Rewrite
- update cycle strictly by autonomous execution protocol

### Acceptance criteria
- any next cycle continues without a new restart
- status, backlog, and sign-off remain aligned

---

## Expected progress after priority 3

- schema and migration hygiene: 68% -> 86%+
- runtime and deploy: 90% -> 94%+
- overall: 88%+ -> 92-95%
