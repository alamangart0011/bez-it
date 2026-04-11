# Sandbox go-live sequence

## Цель
Вывести runtime preview в песочницу на тестовый домен и дойти до состояния готовности к аудиту.

## Порядок
1. применить `patches/runtime-web-switch.patch`;
2. применить `patches/runtime-preview-nginx.patch`;
3. поднять основной preview contour (`3300`);
4. поднять safe preview contour (`3301`);
5. повесить тестовый домен на preview path;
6. проверить root preview;
7. пройти screen audit matrix;
8. зафиксировать дефекты;
9. после стабилизации подготовить root cutover plan.

## Правила
- root/live contour не трогать;
- preview и safe-preview не смешивать;
- если основной preview нестабилен, использовать safe-preview для аудита;
- до smoke не объявлять contour готовым.

## Acceptance
Песочница считается готовой, когда тестовый домен даёт рабочий preview path для аудита сайта.
