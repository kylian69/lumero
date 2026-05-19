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

# Invalidate Cloudflare edge cache so visitors see the new build immediately
# instead of a stale HTML page held at the edge. Skipped silently if the env
# vars aren't set (e.g. local dry runs).
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ZONE_ID:-}" ]; then
  echo "[deploy] Purging Cloudflare cache (zone: $CLOUDFLARE_ZONE_ID)"
  if curl -fsS -X POST \
      "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}' \
      -o /tmp/cf-purge.json; then
    echo "[deploy] Cloudflare purge OK"
  else
    echo "[deploy] WARN: Cloudflare purge failed (deploy still succeeded)" >&2
    cat /tmp/cf-purge.json >&2 || true
  fi
else
  echo "[deploy] Skipping Cloudflare purge (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID not set)"
fi

echo "[deploy] Done."
