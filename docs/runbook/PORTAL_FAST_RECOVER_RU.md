# Portal fast recover

Цель: быстро вернуть рабочее состояние портала `Signalum` в активном контуре без ручного повторения длинных команд.

Что восстанавливается:
- RTC STUN-конфиг в `.env`
- открытый вход в `Голосовой контур` и `Зал собраний`
- проверка логина двух тестовых пользователей
- контрольный вывод `RTC_CONFIG`

Ожидаемые переменные окружения перед запуском:
- `ADMIN_LOGIN`
- `ADMIN_PASSWORD`
- `LEADER_LOGIN`
- `LEADER_PASSWORD`
- `MEMBER_LOGIN`
- `MEMBER_PASSWORD`

Базовый вызов на сервере:

```bash
cd /opt/messenger/contour-chat-jino-final
ADMIN_LOGIN=admin@corpchat.local \
ADMIN_PASSWORD='<admin-password>' \
LEADER_LOGIN=leader@signalum.local \
LEADER_PASSWORD='<leader-password>' \
MEMBER_LOGIN=member@signalum.local \
MEMBER_PASSWORD='<member-password>' \
bash bin/portal_fast_recover.sh
```

Минимальный ожидаемый результат:
- `LEADER_LOGIN_OK=YES`
- `MEMBER_LOGIN_OK=YES`
- `RTC_CONFIG={...}`
- `entryMode=open` для voice/meeting

После recovery:
1. Открыть обычное окно браузера и войти как `leader`
2. Открыть инкогнито и войти как `member`
3. В обоих окнах открыть `Голосовой контур`
4. В обоих окнах нажать `Войти в голос`

Если звук не пошёл:
- проверить `RTC_CONFIG`
- проверить `api` логи по `rtc|voice|socket|peer|signal|join|leave`
- проверить доступность `/socket.io/socket.io.js`
