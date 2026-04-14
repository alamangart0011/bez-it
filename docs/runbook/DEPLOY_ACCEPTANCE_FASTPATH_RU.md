# DEPLOY ACCEPTANCE FASTPATH

Цель: запускать выкладку live-контура и сразу прогонять acceptance-цепочку без ручного переключения между несколькими командами.

Основной файл:
- `deploy/deploy_acceptance_wrapper.sh`

Что делает fastpath:
1. запускает штатный `deploy/deploy.sh`;
2. при наличии acceptance-логина и acceptance-пароля запускает `scripts/portal_post_deploy_acceptance.sh`;
3. при провале acceptance автоматически получает log bundle через `scripts/portal_smoke_log_bundle.sh`.

Базовый вызов:

```bash
cd /opt/messenger/contour-chat-jino-final
PORTAL_ACCEPT_LOGIN=leader@signalum.local \
PORTAL_ACCEPT_PASS='<leader-password>' \
bash deploy/deploy_acceptance_wrapper.sh
```

Если acceptance пока не нужен:

```bash
cd /opt/messenger/contour-chat-jino-final
bash deploy/deploy_acceptance_wrapper.sh
```

Ожидаемое поведение:
- если credentials не заданы, будет только deploy и предупреждение, что acceptance пропущен;
- если credentials заданы, после deploy автоматически идёт acceptance-цепочка;
- при ошибке acceptance будет собран tar.gz bundle с логами.

Когда использовать:
1. на основном релизном прогоне;
2. перед показом;
3. после правок room/voice/runtime;
4. после recovery и повторного деплоя.
