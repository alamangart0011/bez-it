# Portal schema guard

Цель: быстро проверить, что room-based baseline не упирается в schema drift по критичным таблицам и колонкам до runtime-падения.

Файл:
- `scripts/portal_schema_guard.sh`

Что проверяет:
- наличие таблиц `users`, `rooms`, `voice_participants`, `meetings`, `system_settings`, `invitations`
- наличие хотя бы одной из таблиц `room_members` или `room_memberships`
- наличие критичных колонок `users.email`, `users.password_hash`, `users.role`, `rooms.name`, `rooms.kind`, `voice_participants.room_id`, `voice_participants.user_id`, `meetings.room_id`

Базовый запуск:

```bash
cd /opt/messenger/contour-chat-jino-final
bash scripts/portal_schema_guard.sh
```

Ожидаемый результат:
- psql выводит таблицу проверок;
- скрипт заканчивается строкой `[OK] portal schema guard passed`.

Когда использовать:
1. перед deploy;
2. после apply_sql;
3. перед release acceptance;
4. после recovery baseline;
5. при подозрении на schema drift.
