#!/usr/bin/env bash
set -Eeuo pipefail

CONF="/etc/nginx/conf.d/ai.voice.oboron-it.ru.conf"
mkdir -p /var/www/letsencrypt/.well-known/acme-challenge

cat > "$CONF" <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name ai.voice.oboron-it.ru;

    client_max_body_size 100m;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }
}
NGINX

nginx -t
systemctl reload nginx || service nginx reload

echo test > /var/www/letsencrypt/.well-known/acme-challenge/test-token
curl -i http://ai.voice.oboron-it.ru/.well-known/acme-challenge/test-token
curl -i http://ai.voice.oboron-it.ru/api/health
