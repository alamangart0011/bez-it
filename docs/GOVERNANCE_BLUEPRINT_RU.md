# Governance blueprint

## Цель
Оставить один автоматический deploy workflow на push в main и перевести legacy workflow в ручной режим.

## Целевое состояние
- `.github/workflows/deploy-jino.yml` — единственный workflow на `push` в `main`.
- `.github/workflows/deploy-jino-main.yml` — только `workflow_dispatch`.
- `.github/workflows/deploy-jino-fastlane.yml` — только `workflow_dispatch`.

## Контур
1. Bootstrap check.
2. Self-healing workflow для перевода legacy workflow в manual-only.
3. Policy check на каждый PR.
4. Required checks и auto-merge после стабилизации.
