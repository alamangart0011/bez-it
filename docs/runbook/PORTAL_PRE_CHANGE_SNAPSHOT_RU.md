# Portal pre-change snapshot

Цель: перед любым live-изменением быстро снять безопасный снимок состояния текущего контура, чтобы не терять release/meta/assets/runtime-картину.

Файл:
- `scripts/portal_pre_change_snapshot.sh`

Что снимает:
- `/api/health`
- `/api/release`
- `/api/live`
- `/api/ready`
- HTML главной страницы и текущий `assets/index-*.js`
- заголовки `/socket.io/socket.io.js`
- `docker compose ps`
- `docker compose config`
- последние логи `api/web/db`
- safe-выборку release/env ключей из `.env`

Базовый запуск:

```bash
cd /opt/messenger/contour-chat-jino-final
bash scripts/portal_pre_change_snapshot.sh
```

Запуск с явным base url и каталогом:

```bash
cd /opt/messenger/contour-chat-jino-final
bash scripts/portal_pre_change_snapshot.sh \
  http://127.0.0.1:8080 \
  /tmp
```

Результат:
- на stdout печатается путь к `tar.gz` архиву;
- архив можно приложить к инциденту, recovery-циклу или новому чату.

Когда использовать:
1. перед deploy;
2. перед schema-fix;
3. перед принудительной нормализацией frontend;
4. перед rollback/recover;
5. перед любым ручным live-вмешательством.
