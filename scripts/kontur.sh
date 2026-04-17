#!/usr/bin/env bash
# Единая консоль оператора CorpChat V17.
# Обёртка над deploy/*.sh — ничего нового не делает, только вызывает.
# Активный набор соответствует README и CLAUDE.md (one baseline, one deploy path).

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEPLOY_DIR="${REPO_ROOT}/deploy"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
cyan()  { printf '\033[36m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

require() {
  local path="$1"
  if [ ! -x "$path" ]; then
    red "нет исполняемого файла: $path"
    return 1
  fi
}

run() {
  local title="$1"; shift
  cyan "→ ${title}"
  echo "  $*"
  echo
  "$@"
  local rc=$?
  echo
  if [ $rc -eq 0 ]; then
    green "готово (rc=0)"
  else
    red   "ошибка (rc=${rc})"
  fi
  return $rc
}

action_doctor()       { require "${DEPLOY_DIR}/doctor.sh"            && run "диагностика контура"       "${DEPLOY_DIR}/doctor.sh"            "$@"; }
action_deploy()       { require "${DEPLOY_DIR}/jino_one_command.sh"  && run "выкладка (jino one command)" "${DEPLOY_DIR}/jino_one_command.sh"  "$@"; }
action_rollback()     { require "${DEPLOY_DIR}/rollback.sh"          && run "откат релиза"              "${DEPLOY_DIR}/rollback.sh"          "$@"; }
action_smoke_local()  { require "${DEPLOY_DIR}/dev_room_smoke.sh"    && run "smoke (локально)"          "${DEPLOY_DIR}/dev_room_smoke.sh"    "$@"; }
action_smoke_remote() { require "${DEPLOY_DIR}/remote_dev_room_smoke.sh" && run "smoke (по SSH)"        "${DEPLOY_DIR}/remote_dev_room_smoke.sh" "$@"; }
action_post_deploy()  { require "${DEPLOY_DIR}/post_deploy_check.sh" && run "пост-деплой проверка"      "${DEPLOY_DIR}/post_deploy_check.sh" "$@"; }
action_logs()         { require "${DEPLOY_DIR}/collect_logs.sh"      && run "сбор логов api/web/db"     "${DEPLOY_DIR}/collect_logs.sh"      "$@"; }
action_backup()       { require "${DEPLOY_DIR}/backup_db.sh"         && run "бэкап БД"                  "${DEPLOY_DIR}/backup_db.sh"         "$@"; }
action_restore()      {
  require "${DEPLOY_DIR}/restore_db.sh" || return 1
  if [ $# -lt 1 ]; then
    red "нужен путь к дампу: kontur.sh restore /path/to/dump.sql.gz"
    return 2
  fi
  run "восстановление БД из ${1}" "${DEPLOY_DIR}/restore_db.sh" "$@"
}

print_menu() {
  bold "CorpChat V17 — консоль оператора"
  echo "  корень: ${REPO_ROOT}"
  echo
  echo "  1) диагностика контура (doctor)"
  echo "  2) выкатить (deploy)"
  echo "  3) откатить (rollback)"
  echo "  4) smoke — локально"
  echo "  5) smoke — по SSH на VPS"
  echo "  6) пост-деплой проверка"
  echo "  7) собрать логи api/web/db"
  echo "  8) бэкап БД"
  echo "  9) восстановить БД из дампа"
  echo "  0) выход"
  echo
}

dispatch() {
  case "$1" in
    1|doctor)        shift; action_doctor       "$@";;
    2|deploy)        shift; action_deploy       "$@";;
    3|rollback)      shift; action_rollback     "$@";;
    4|smoke)         shift; action_smoke_local  "$@";;
    5|smoke-remote)  shift; action_smoke_remote "$@";;
    6|post-deploy)   shift; action_post_deploy  "$@";;
    7|logs)          shift; action_logs         "$@";;
    8|backup)        shift; action_backup       "$@";;
    9|restore)       shift; action_restore      "$@";;
    0|exit|quit|q)   return 0;;
    -h|--help|help|'')
      print_menu
      echo "прямой вызов:  scripts/kontur.sh <команда> [аргументы]"
      echo "команды:       doctor | deploy | rollback | smoke | smoke-remote | post-deploy | logs | backup | restore"
      ;;
    *)
      red "неизвестная команда: $1"
      echo
      print_menu
      return 2
      ;;
  esac
}

interactive_loop() {
  while :; do
    print_menu
    printf 'выбор: '
    read -r choice
    [ -z "${choice:-}" ] && continue
    if [ "$choice" = "0" ] || [ "$choice" = "q" ]; then
      break
    fi
    if [ "$choice" = "9" ]; then
      printf 'путь к дампу: '
      read -r dump
      dispatch 9 "$dump"
    else
      dispatch "$choice"
    fi
    echo
    printf 'Enter — продолжить, q — выйти: '
    read -r cont
    [ "$cont" = "q" ] && break
    clear || true
  done
}

if [ $# -eq 0 ]; then
  interactive_loop
else
  dispatch "$@"
fi
