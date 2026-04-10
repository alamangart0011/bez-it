# Changelog supplement: automation layer

## Что добавлено
- preflight для automation-layer;
- verify-скрипт для shell-toolchain;
- status-report для automation-файлов;
- module probe по токену;
- recovery orchestrator;
- runtime audit bundle builder;
- wrapper для генерации audit bundle;
- one-command runner recovery + bundle;
- дополнительные runbook и индексы automation-слоя.

## Зачем это сделано
Чтобы active baseline `room-based-v17` можно было проверять, восстанавливать и передавать не по памяти, а по повторяемой последовательности команд и артефактов.
