This is NOT a new project.

Active baseline:
- /opt/messenger/contour-chat-jino-final
- domain: https://ai.voice.oboron-it.ru

Stack:
- Node.js
- PostgreSQL
- React + Vite
- Docker

Active canon:
- room-based V17
- Russian-only UI
- one baseline
- one deploy path

Rules:
- do not restart project
- do not introduce messenger-first
- do not create parallel production branches
- do not create decorative features
- no empty UI elements
- no English UI labels

Workflow:
1. analyze current code
2. identify active modules
3. detect gaps
4. only then implement

Each change:
UX → API → service → repository → DB → deploy → smoke
