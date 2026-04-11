# Jino HTTPS decision

## Принятое решение
Для песочницы `ai.voice.oboron-it.ru` используем Jino как внешний SSL-терминатор.

Схема:
- внешний 80 -> внутренний 80
- внешний 443 -> внутренний 80
- сертификат и HTTPS-проксирование обслуживаются на стороне Jino
- VPS держит только HTTP nginx и проксирует трафик на `127.0.0.1:8080`

## Почему так
- HTTP контур на VPS уже рабочий
- challenge-файлы по `/.well-known/acme-challenge/` на VPS уже отдаются правильно
- локальный `api/health` уже отвечает `200`
- попытка выпускать certbot на VPS конфликтует с внешним HTTPS-контуром Jino

## Что не делать
- не поднимать локальный 443 на VPS
- не гонять certbot на VPS, пока Jino сам терминирует SSL
- не менять DNS A/CAA/MX/SPF/DKIM без отдельной причины

## Что считать успехом
- `http://ai.voice.oboron-it.ru/api/health` -> 200
- `https://ai.voice.oboron-it.ru/` -> 200 html
- `https://ai.voice.oboron-it.ru/api/health` -> 200 json
- `https://ai.voice.oboron-it.ru/api/rooms` -> 401 или 200 в зависимости от auth слоя
