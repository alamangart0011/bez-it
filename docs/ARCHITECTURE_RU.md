# Архитектура SIGNALUM Voice AI Portal

## Ядро
Voice-first корпоративная платформа с постоянными комнатами, чатами, transcript, assistant и control-plane.

## Слои
- client layer: web / desktop shell / mobile later
- api layer: auth / rooms / messaging / calls / transcript / assistants / knowledge / actions
- ai layer: orchestrator / prompts / retrieval / summaries / follow-up
- ops layer: deploy / health / backup / rollback / smoke / governance

## Принцип
Одна продуктовая линия, один control-plane, один deploy path, потом AI-надстройка.
