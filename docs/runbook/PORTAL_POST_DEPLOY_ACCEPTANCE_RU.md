# Portal post-deploy acceptance

Цель: прогонять основной acceptance live-контура одной командой сразу после деплоя и перед браузерной проверкой.

Файл:
- `scripts/portal_post_deploy_acceptance.sh`

Что запускается по цепочке:
1. `scripts/smoke_web_entry.sh`
2. `deploy/post_deploy_check.sh`
3. `scripts/room_based_acceptance_smoke.sh`
4. `scripts/portal_voice_verify.sh`

Что делает при ошибке:
- автоматически вызывает `scripts/portal_smoke_log_bundle.sh`;
- печатает путь к собранному tar.gz с логами и runtime-снимком.

Базовый запуск:

```bash
cd /opt/messenger/contour-chat-jino-final
PORTAL_ACCEPT_LOGIN=leader@signalum.local \
PORTAL_ACCEPT_PASSWORD='<leader-password>' \
bash scripts/portal_post_deploy_acceptance.sh
```

Запуск с явными параметрами:

```bash
cd /opt/messenger/contour-chat-jino-final
bash scripts/portal_post_deploy_acceptance.sh \
  http://127.0.0.1:8080 \
  leader@signalum.local \
  '<leader-password>'
```

Минимальный ожидаемый результат:
- `smoke_web_entry` проходит;
- `post_deploy_check` проходит;
- `room_based_acceptance_smoke` проходит;
- `portal_voice_verify` проходит;
- итоговая строка: `[OK] portal post deploy acceptance passed`.

Когда использовать:
1. сразу после deploy/apply_sql;
2. перед показом;
3. после recovery;
4. после правок frontend/backend, затрагивающих rooms/voice.
