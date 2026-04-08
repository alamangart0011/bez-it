# Jino — fast path при инциденте

1. `./deploy/doctor.sh`
2. `./deploy/collect_logs.sh`
3. `./deploy/backup_db.sh`
4. `docker compose ps`
5. `curl -fsS http://127.0.0.1:8080/api/health`
6. при необходимости `APP_DIR=/opt/messenger/contour-chat-jino-final ./deploy/rollback.sh <backup.tar.gz>`
7. если повреждена БД — `./deploy/restore_db.sh <db_dump.sql.gz>`
