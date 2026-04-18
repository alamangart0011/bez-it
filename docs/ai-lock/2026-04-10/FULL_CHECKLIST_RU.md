# Signalum / bez-it — полный чек-лист проверки

## P0. Контур и доступ
- [ ] SSH на Jino работает
- [ ] Путь `/opt/messenger/contour-chat-jino-final` существует
- [ ] `docker compose ps` без crash loop
- [ ] `api/health` = 200
- [ ] `api/release` = 200
- [ ] Логин `admin@corpchat.local` проходит
- [ ] `GET /api/me` не 500

## P0. Контракт комнат
- [ ] `GET /api/rooms`
- [ ] `PATCH /api/rooms/:id`
- [ ] `GET /api/rooms/:id/members`
- [ ] `POST /api/rooms/:id/members`
- [ ] `DELETE /api/rooms/:id/members/:userId`
- [ ] `POST /api/rooms/:id/join`
- [ ] `POST /api/rooms/:id/messages` принимает `content`
- [ ] `DELETE /api/rooms/:roomId/messages/:messageId`
- [ ] `POST /api/rooms/:roomId/messages/:messageId/pin`

## P0. БД и schema parity
- [ ] `users`
- [ ] `room_members` / `room_memberships`
- [ ] `voice_participants`
- [ ] `user_profiles`
- [ ] `departments`
- [ ] `invitations`
- [ ] `system_settings`
- [ ] `room_incidents`
- [ ] `auth_sessions`
- [ ] `meetings` / `meeting_events`

## P1. UI / UX
- [ ] shell без пустых экранов
- [ ] комнаты видны слева
- [ ] админка открывается
- [ ] right panel сотрудников не пустой
- [ ] voice room открывается
- [ ] device picker
- [ ] speaking indicator
- [ ] meeting room открывается

## P1. Smoke / regression
- [ ] login
- [ ] me
- [ ] admin overview/users/rooms/system/invitations/incidents
- [ ] room list/detail/messages
- [ ] voice join/self/leave/state
- [ ] create room
- [ ] create message
