# Portal voice verify

Цель: одной командой проверить, что live-контур `Signalum` после деплоя действительно готов к двухклиентской голосовой проверке.

Что проверяет скрипт:
- `/api/health`
- `/api/release`
- логин тестовым пользователем
- `/api/rtc/config`
- доступность `/socket.io/socket.io.js`
- `voice state` канонической голосовой комнаты
- `members` голосовой и meeting-комнаты

Файл:
- `scripts/portal_voice_verify.sh`

Базовый запуск на сервере:

```bash
cd /opt/messenger/contour-chat-jino-final
PORTAL_VERIFY_LOGIN=leader@signalum.local \
PORTAL_VERIFY_PASSWORD='<leader-password>' \
bash scripts/portal_voice_verify.sh
```

Запуск с явным base url:

```bash
cd /opt/messenger/contour-chat-jino-final
bash scripts/portal_voice_verify.sh \
  http://127.0.0.1:8080 \
  leader@signalum.local \
  '<leader-password>'
```

Минимальный ожидаемый результат:
- `health_ok: true`
- есть `release_version`
- есть `socket_status_line` с `200 OK`
- `voice_state_count` и `voice_members_count` не дают ошибок
- скрипт заканчивается строкой `[OK] portal voice verify passed`

Когда использовать:
1. сразу после деплоя;
2. перед браузерным acceptance-прогоном;
3. после recovery voice-контура;
4. перед показом пользователям.

Что делать после успешного результата:
1. открыть обычное окно браузера;
2. открыть инкогнито;
3. зайти как `leader` и `member`;
4. в обоих окнах открыть `Голосовой контур`;
5. в обоих окнах нажать `Войти в голос`.
