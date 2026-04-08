# CorpChat V17 — этап 2: доступ, восстановление, приглашения и сессии

## Что включено
- вход по логину или рабочей почте;
- refresh rotation и server-side проверка живой сессии;
- список активных сессий и журнал auth-событий;
- завершение одной сессии, всех других сессий или всех устройств;
- сценарий «Забыли пароль?»;
- установка нового пароля по служебному reset-токену;
- первый вход по приглашению администратора.

## Что важно
- публичная хаотичная регистрация не используется;
- приглашение принимает только корпоративный сценарий;
- после смены пароля остальные сессии завершаются автоматически;
- logout-all реально отсекает доступ, потому что access token теперь проверяется ещё и по active session в БД.

## Стендовые данные
- логин: `admin@corpchat.local`
- пароль: `admin123`
- демонстрационный токен приглашения: `invite_demo_stage2_2026`
- почта из приглашения: `new.employee@corpchat.local`

## Восстановление доступа
Для текущего пакета внешний почтовый шлюз не подключён.
Поэтому `POST /api/auth/forgot-password` возвращает служебный reset-токен сразу в ответе, чтобы полный сценарий восстановления можно было проверить без внешней интеграции.

## Маршруты
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:sessionId`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/invite/:token`
- `POST /api/auth/accept-invite`
