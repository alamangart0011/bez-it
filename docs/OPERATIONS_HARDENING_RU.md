# CorpChat V17 — operations hardening

Что добавлено поверх final hosting:
- request-id и структурированный access log на backend;
- `/api/live`, `/api/ready`, расширенный `/api/health`;
- индикаторы API / сокета / сети в topbar;
- `deploy/backup_db.sh`, `deploy/restore_db.sh`, `deploy/collect_logs.sh`;
- расширенный smoke и post-deploy checks.

Практический смысл:
1. На выкладке проще понять, приложение умерло полностью или деградировал только один контур.
2. На показе виден статус API и сокета прямо в shell.
3. Перед любыми опасными действиями можно снять резервную копию БД отдельно от файлового backup.
4. После инцидента можно быстро собрать логи и приложить их к разбору.
