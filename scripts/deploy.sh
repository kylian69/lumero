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

# Must target the same compose project that brought the stack up on the host,
# otherwise compose can't see the running lume-app and collides on its fixed
# container_name instead of replacing it.
PROJECT="${COMPOSE_PROJECT_NAME:-lumero}"

echo "[deploy] Project: $PROJECT  Image: $IMAGE"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.prod.yml pull app

echo "[deploy] Recreating app container"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.prod.yml up -d --no-deps --force-recreate app

echo "[deploy] Pruning dangling images"
docker image prune -f >/dev/null

echo "[deploy] Done."
