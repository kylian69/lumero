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

# Short sha derived from the image tag (after the last "sha-") for nicer logs/notifs.
SHORT_SHA="${IMAGE##*sha-}"
SHORT_SHA="${SHORT_SHA:0:7}"

notify_discord() {
  # Best-effort Discord notification. Never fails the deploy.
  # Args: $1 = title, $2 = description, $3 = color (decimal)
  local title="$1" desc="$2" color="$3"
  if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
    return 0
  fi
  local payload
  payload=$(printf '{"embeds":[{"title":%s,"description":%s,"color":%s}]}' \
    "\"$title\"" \
    "\"$desc\"" \
    "$color")
  curl -fsS -X POST "$DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null 2>&1 || true
}

on_error() {
  notify_discord "❌ Déploiement échoué" \
    "Commit \`${SHORT_SHA}\` — voir les logs de \`lume-deploy-agent\`." \
    15158332
}
trap on_error ERR

cd "${COMPOSE_PROJECT_DIR:-/workspace}"

# Must target the same compose project that brought the stack up on the host,
# otherwise compose can't see the running lume-app and collides on its fixed
# container_name instead of replacing it.
PROJECT="${COMPOSE_PROJECT_NAME:-lumero}"

notify_discord "🚀 Déploiement en cours" \
  "Commit \`${SHORT_SHA}\` — pull de l'image + redémarrage de \`lume-app\`." \
  3447003

echo "[deploy] Project: $PROJECT  Image: $IMAGE"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.prod.yml pull app

echo "[deploy] Recreating app container"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.prod.yml up -d --no-deps --force-recreate app

echo "[deploy] Pruning dangling images"
docker image prune -f >/dev/null

# Invalidate Cloudflare edge cache so visitors see the new build immediately
# instead of a stale HTML page held at the edge. Skipped silently if the env
# vars aren't set (e.g. local dry runs).
CF_PURGE_STATUS="skipped"
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ZONE_ID:-}" ]; then
  echo "[deploy] Purging Cloudflare cache (zone: $CLOUDFLARE_ZONE_ID)"
  if curl -fsS -X POST \
      "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}' \
      -o /tmp/cf-purge.json; then
    echo "[deploy] Cloudflare purge OK"
    CF_PURGE_STATUS="ok"
  else
    echo "[deploy] WARN: Cloudflare purge failed (deploy still succeeded)" >&2
    cat /tmp/cf-purge.json >&2 || true
    CF_PURGE_STATUS="failed"
  fi
else
  echo "[deploy] Skipping Cloudflare purge (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID not set)"
fi

case "$CF_PURGE_STATUS" in
  ok)      CF_LINE="✅ Cache Cloudflare purgé" ;;
  failed)  CF_LINE="⚠️ Purge Cloudflare en échec (à vérifier)" ;;
  *)       CF_LINE="ℹ️ Purge Cloudflare désactivée" ;;
esac

notify_discord "✅ Déploiement terminé" \
  "Commit \`${SHORT_SHA}\` est en ligne sur https://lumero.fr.\n${CF_LINE}" \
  3066993

trap - ERR
echo "[deploy] Done."
