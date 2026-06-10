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

# Reclaim disk: removes images no longer referenced by a container (including
# stale :sha-xxxx tags), the BuildKit cache and stopped containers. The
# preview-orchestrator is rebuilt on every deploy and its BuildKit cache
# accumulates fast (native better-sqlite3 toolchain), filling the disk.
# Safe by design — never touches named volumes (Postgres data is preserved).
reclaim_disk() {
  echo "[deploy] Reclaiming disk (unused images, build cache, stopped containers)"
  docker image prune -af >/dev/null 2>&1 || true
  docker builder prune -af >/dev/null 2>&1 || true
  docker container prune -f >/dev/null 2>&1 || true
}
# Run on every exit (success OR failure) so a deploy that crashes mid-pull —
# e.g. "no space left on device" — still frees space before the next attempt.
trap reclaim_disk EXIT

cd "${COMPOSE_PROJECT_DIR:-/workspace}"

# Must target the same compose project that brought the stack up on the host,
# otherwise compose can't see the running lume-app and collides on its fixed
# container_name instead of replacing it.
PROJECT="${COMPOSE_PROJECT_NAME:-lumero}"

# Bring the working copy up to date so the locally-built services (e.g. the
# preview-orchestrator) and the mounted config (compose file, this script) match
# the deployed app image. Best-effort, fast-forward only: never rewrites local
# state, and is a clean no-op if git is unavailable in the agent image.
if command -v git >/dev/null 2>&1 && [ -d .git ]; then
  echo "[deploy] Updating working copy (git pull --ff-only)"
  # The agent runs as root on a host-owned mount; declare it safe for git.
  git config --global --add safe.directory "$(pwd)" 2>/dev/null || true
  git pull --ff-only origin main || \
    echo "[deploy] WARN: git pull failed; building from existing working copy" >&2
else
  echo "[deploy] git unavailable; building preview-orchestrator from the working copy as-is" >&2
fi

notify_discord "🚀 Déploiement en cours" \
  "Commit \`${SHORT_SHA}\` — pull de l'image + redémarrage de \`lume-app\`." \
  3447003

# Free space BEFORE pulling the new image so the extraction does not fail with
# "no space left on device" on a disk clogged by previous deploys.
reclaim_disk

echo "[deploy] Project: $PROJECT  Image: $IMAGE"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.prod.yml pull app

echo "[deploy] Recreating app container"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.prod.yml up -d --no-deps --force-recreate app

# Rebuild + recreate the preview-orchestrator from the local working copy. It is
# built on the VM (image lume-preview-orchestrator:local), not pulled from a
# registry, so the deploy webhook must rebuild it for code changes (e.g. the
# preview access gate) to take effect. The Docker layer cache makes this a near
# no-op when its sources are unchanged.
echo "[deploy] Rebuilding preview-orchestrator"
docker compose -p "$PROJECT" -f docker-compose.prod.yml build preview-orchestrator

echo "[deploy] Recreating preview-orchestrator container"
docker compose -p "$PROJECT" -f docker-compose.prod.yml up -d --no-deps --force-recreate preview-orchestrator

# Ensure the observability stack (Loki + Promtail + Grafana) is running. New
# services are created on first deploy; existing ones are reconciled if their
# definition changed. cloudflared ingress is dashboard-managed in prod, so no
# restart is needed here (the Grafana Public Hostname is configured in the
# Cloudflare Zero Trust dashboard).
echo "[deploy] Ensuring observability stack (loki/promtail/grafana)"
docker compose -p "$PROJECT" -f docker-compose.prod.yml up -d loki promtail grafana

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
