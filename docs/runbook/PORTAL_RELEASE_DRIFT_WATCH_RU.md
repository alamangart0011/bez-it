# Portal release drift watch

Цель: быстро проверить, что локальный runtime и внешний домен отдают один и тот же release/state, и что после выкладки не произошло drift по asset/release.

Файл:
- `scripts/portal_release_drift_watch.sh`

Что сравнивает:
- локальный `/api/release`
- внешний `/api/release`
- локальный `/api/health`
- внешний `/api/health`
- локальный `assets/index-*.js`
- внешний `assets/index-*.js`

Базовый запуск:

```bash
cd /opt/messenger/contour-chat-jino-final
bash scripts/portal_release_drift_watch.sh
```

Запуск с явными URL:

```bash
cd /opt/messenger/contour-chat-jino-final
bash scripts/portal_release_drift_watch.sh \
  http://127.0.0.1:8080 \
  https://ai.voice.oboron-it.ru
```

Минимальный ожидаемый результат:
- `release_match: true`
- `asset_match: true`
- `local_health_ok: true`
- `external_health_ok: true`
- итоговая строка: `[OK] portal release drift watch passed`

Когда использовать:
1. сразу после deploy;
2. после нормализации frontend;
3. после recovery;
4. когда есть подозрение, что снаружи отдаётся старый bundle;
5. перед показом или acceptance-прогоном.
