# Test domain ready status

## Что уже готово в ветке
- switch patch для existing `rooms/calls` entrypoints;
- основной preview contour (`3300`);
- safe preview contour (`3301`);
- nginx assets для `/runtime-preview` и `/runtime-preview-safe`;
- server config под тестовый домен;
- audit sequence и screen audit matrix.

## Что осталось выполнить
1. применить switch patch;
2. поднять preview contour(ы);
3. положить nginx server config для тестового домена;
4. открыть preview path на домене;
5. пройти экранный аудит.

## Практический вывод
Пакет уже близок к `sandbox-ready`.
Главный незавершенный шаг — не подготовка артефактов, а фактическое применение patch/compose/nginx на стороне песочницы.
