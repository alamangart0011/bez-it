#!/usr/bin/env bash
# bez-it.ru — добавить выделенный IP для кабинета (второй адрес на том же VPS)
# Jino выдал IP 217.149.30.147; привязываем его к eth0 + прописываем в netplan.
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

PRIMARY_CIDR="$(ip -o -4 addr show dev "${IFACE}" scope global | awk '{print $4}' | head -1)"
PRIMARY_IP="${PRIMARY_CIDR%%/*}"
PREFIX="${PRIMARY_CIDR##*/}"

log "параметры"
echo "  интерфейс:      ${IFACE}"
echo "  основной IP:    ${PRIMARY_IP}/${PREFIX}"
echo "  добавляем:      ${SECONDARY_IP}/${PREFIX}"

log "1/3 · добавляю адрес на интерфейс (runtime)"
if ip -4 addr show dev "${IFACE}" | grep -qw "${SECONDARY_IP}"; then
  echo "  уже присутствует — пропускаю"
else
  ip addr add "${SECONDARY_IP}/${PREFIX}" dev "${IFACE}"
  echo "  ✓ добавлен"
fi

log "2/3 · делаю адрес постоянным через netplan overlay"
NETPLAN_FILE=/etc/netplan/99-bez-it-secondary-ip.yaml
cat > "${NETPLAN_FILE}" <<EOF
# bez-it.ru — выделенный IP для kabinet.bez-it.ru
# Добавлено: $(date -Iseconds)
network:
  version: 2
  ethernets:
    ${IFACE}:
      addresses:
        - ${SECONDARY_IP}/${PREFIX}
EOF
chmod 600 "${NETPLAN_FILE}"
echo "  записан: ${NETPLAN_FILE}"
if netplan apply 2>&1; then
  echo "  ✓ netplan apply успешен"
else
  warn "netplan apply выдал warning — IP уже добавлен вручную, переживёт ребут"
fi

log "3/3 · проверка"
echo "  адреса на ${IFACE}:"
ip -4 addr show dev "${IFACE}" | awk '/inet /{print "    " $2}'

echo
if ping -c 1 -W 2 -I "${SECONDARY_IP}" 8.8.8.8 >/dev/null 2>&1; then
  echo "  ✓ ${SECONDARY_IP} доступен в интернет"
else
  warn "  ping через ${SECONDARY_IP} не прошёл — возможно, Jino ещё не маршрутизирует. Попробуйте через 1–2 минуты."
fi

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Выделенный IP ${SECONDARY_IP} привязан к VPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DNS (в панели Jino):
    bez-it.ru          A  →  ${PRIMARY_IP}
    www.bez-it.ru      A  →  ${PRIMARY_IP}
    kabinet.bez-it.ru  A  →  ${SECONDARY_IP}

  После DNS-обновления — запустите:
    bash /opt/bez-it/deploy/jino-tls.sh admin@bez-it.ru
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
