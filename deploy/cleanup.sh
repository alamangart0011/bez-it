#!/usr/bin/env bash
set -Eeuo pipefail

docker builder prune -f || true
docker image prune -f || true
docker container prune -f || true
docker volume prune -f || true
