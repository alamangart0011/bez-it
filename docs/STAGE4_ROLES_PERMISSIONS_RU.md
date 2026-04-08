# CorpChat V17 / Этап 4

Закрыто в этой редакции:
- единая матрица ролей и прав;
- роли: `super_admin`, `admin`, `leader`, `moderator`, `member`, `guest`, `external`, `blocked`;
- каталог permissions и таблица `role_permissions`;
- backend guards для `admin.access`, `audit.read`, `users.manage`, `roles.manage`, `sessions.manage`, `voice.join`;
- frontend `PermissionGuard` и русские экраны отказа в доступе;
- центр администратора с обзором пользователей, отделов, ролей и последних событий аудита.

Практический результат:
- доступ управляется не хаотично, а через явную матрицу;
- UI и API согласованы по правам;
- пользователь получает нормальные русские сообщения вместо «молчаливых» провалов или пустых экранов.
