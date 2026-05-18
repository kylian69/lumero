#!/bin/bash
# Pull a new image tag and restart the app service.
# Called by the deploy-agent webhook receiver.
# Argument: $1 = full image reference (e.g. ghcr.io/kylian69/lumero:sha-abcdef)

set -euo pipefail

IMAGE="${1:-}"
if [ -z "$IMAGE" ]; then
  echo "[deploy] ERROR: missing image argument" >&2
  exit 1
fi

cd "${COMPOSE_PROJECT_DIR:-/workspace}"

echo "[deploy] Pulling image: $IMAGE"
IMAGE="$IMAGE" docker compose -f docker-compose.prod.yml pull app

echo "[deploy] Recreating app container"
IMAGE="$IMAGE" docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate app

echo "[deploy] Pruning dangling images"
docker image prune -f >/dev/null

echo "[deploy] Done."
