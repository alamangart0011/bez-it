# Test domain operations card

## Что нужно сделать оператору
1. подставить фактический тестовый домен в `runtime-preview.test-domain.server.conf`;
2. применить switch patch;
3. поднять основной preview contour;
4. при необходимости поднять safe preview contour;
5. положить nginx config;
6. проверить `nginx -t` и reload;
7. открыть preview path на домене;
8. пройти audit sequence;
9. заполнить audit report template.

## Основной путь
- `http://<TEST_DOMAIN>/runtime-preview/`

## Запасной путь
- `http://<TEST_DOMAIN>/runtime-preview-safe/`

## Документы для исполнения
- `docs/SANDBOX_READY_BUNDLE_RU.md`
- `docs/TEST_DOMAIN_MINIMAL_EXECUTION_RU.md`
- `docs/TEST_DOMAIN_AUDIT_SEQUENCE_RU.md`
- `docs/TEST_DOMAIN_SCREEN_AUDIT_MATRIX_RU.md`
- `docs/PR13_RUNTIME_AUDIT_REPORT_TEMPLATE_RU.md`
