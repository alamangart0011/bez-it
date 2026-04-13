# Реестр доступов и ограничений

## Подтверждённые доступы

### GitHub
- Аккаунт: `alamangart0011`
- Репозиторий: `alamangart0011/contour-chat-v17`
- Уровень доступа: `admin`

### Jino / VPS
- Серверный путь baseline: `/opt/messenger/contour-chat-jino-final`
- SSH вход через alias `jino-messenger` уже работает
- Операционный пользователь: `deploy`
- Эскалация: `sudo`

### Домен
- Канонический домен: `ai.voice.oboron-it.ru`

## Подтверждённые GitHub secrets (только имена)
- `JINO_APP_DIR`
- `JINO_DEPLOY_HOST`
- `JINO_DEPLOY_PORT`
- `JINO_DEPLOY_SSH_KEY`
- `JINO_DEPLOY_USER`

## Ограничения
- GitHub branch protection и rulesets для приватного репозитория недоступны на текущем тарифе.
- Значит дисциплина релиза должна держаться не на native protection, а на:
  - одном deploy path
  - одном workflow на push main
  - PR discipline
  - ручной release discipline

## Что уже не нужно восстанавливать заново
- HTTPS / 443
- nginx
- доступ на сервер
- alias `jino-messenger`
- базовый server health