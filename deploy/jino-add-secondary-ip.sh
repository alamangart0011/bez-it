#!/usr/bin/env bash
# bez-it.ru — привязать выделенный IP для kabinet.bez-it.ru
# Использует systemd-сервис (не трогает netplan, не ломает primary IP).
# Идемпотентно: безопасно запускать повторно.
# Использование:
#   bash deploy/jino-add-secondary-ip.sh                      # default 217.149.30.147
#   bash deploy/jino-add-secondary-ip.sh 217.149.30.147 eth0  # явно
set -euo pipefail

SECONDARY_IP="${1:-217.149.30.147}"
IFACE="${2:-$(ip -o -4 route show default | awk '{print $5}' | head -1)}"

log()  { echo -e "\n[$(date +%H:%M:%S)] \033[1;32m$*\033[0m"; }
warn() { echo -e "\n[$(date +%H:%M:%S)] \033[1;33m$*\033[0m"; }
err()  { echo -e "\n[$(date +%H:%M:%S)] \033[1;31m$*\033[0m" >&2; }

if [[ $EUID -ne 0 ]]; then err "запустите от root"; exit 1; fi
if [[ -z "${IFACE}" ]]; then err "не удалось определить сетевой интерфейс"; exit 1; fi

PRIMARY_CIDR="$(ip -o -4 addr show dev "${IFACE}" scope global | awk 'NR==1{print $4}')"
PRIMARY_IP="${PRIMARY_CIDR%%/*}"
PREFIX="${PRIMARY_CIDR##*/}"

log "параметры"
echo "  интерфейс:      ${IFACE}"
echo "  основной IP:    ${PRIMARY_IP}/${PREFIX}"
echo "  добавляем:      ${SECONDARY_IP}/${PREFIX}"

# Удалить опасный netplan overlay, если был создан прошлой версией скрипта.
# Прошлая версия писала netplan-файл, который при следующем `netplan apply`
# заменил бы primary IP — могли потерять SSH. Используем systemd-unit.
OLD_NETPLAN=/etc/netplan/99-bez-it-secondary-ip.yaml
if [[ -f "${OLD_NETPLAN}" ]]; then
  log "удаляю небезопасный netplan overlay ${OLD_NETPLAN}"
  rm -f "${OLD_NETPLAN}"
fi

log "1/3 · добавляю адрес на интерфейс (runtime)"
if ip -4 addr show dev "${IFACE}" | grep -qw "${SECONDARY_IP}"; then
  echo "  уже присутствует"
else
  ip addr add "${SECONDARY_IP}/${PREFIX}" dev "${IFACE}"
  echo "  ✓ добавлен"
fi

log "2/3 · регистрирую systemd-unit (переживает ребут, primary IP не трогает)"
UNIT=/etc/systemd/system/bez-it-secondary-ip.service
cat > "${UNIT}" <<EOF
[Unit]
Description=bez-it.ru secondary IP for kabinet.bez-it.ru
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/sh -c '/sbin/ip addr add ${SECONDARY_IP}/${PREFIX} dev ${IFACE} 2>/dev/null || true'
ExecStop=/bin/sh -c '/sbin/ip addr del ${SECONDARY_IP}/${PREFIX} dev ${IFACE} 2>/dev/null || true'

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable bez-it-secondary-ip.service >/dev/null 2>&1
systemctl start bez-it-secondary-ip.service
echo "  ✓ ${UNIT} установлен и активен"

log "3/3 · проверка"
echo "  адреса на ${IFACE}:"
ip -4 addr show dev "${IFACE}" | awk '/inet /{print "    " $2}'

echo
if ping -c 1 -W 3 -I "${SECONDARY_IP}" 8.8.8.8 >/dev/null 2>&1; then
  echo "  ✓ ${SECONDARY_IP} доступен в интернет"
else
  warn "  ping через ${SECONDARY_IP} не прошёл — возможно, Jino ещё не маршрутизирует исходящий трафик с него. Для входящих (HTTPS) не критично."
fi

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Выделенный IP ${SECONDARY_IP} привязан к VPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DNS (в панели Jino):
    bez-it.ru          A  →  ${PRIMARY_IP}
    www.bez-it.ru      A  →  ${PRIMARY_IP}
    kabinet.bez-it.ru  A  →  ${SECONDARY_IP}

  После DNS-обновления:
    bash /opt/bez-it/deploy/jino-tls.sh admin@bez-it.ru
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
