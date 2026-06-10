#!/bin/bash
# Staging counterpart of deploy.sh.
# Pulls a new :staging image, runs migrations (via the app entrypoint) and the
# idempotent seed, then restarts the staging app service.
# Called by the staging deploy-agent webhook receiver.
# Argument: $1 = full image reference (e.g. ghcr.io/kylian69/lumero:sha-abcdef)
#
# IMPORTANT: this stack must live in its own working copy on the VM (e.g.
# /opt/lumero-staging), checked out on the `develop` branch, separate from the
# production checkout. Otherwise the git pull below fights the prod deploy.

set -euo pipefail

IMAGE="${1:-}"
if [ -z "$IMAGE" ]; then
  echo "[deploy-staging] ERROR: missing image argument" >&2
  exit 1
fi

SHORT_SHA="${IMAGE##*sha-}"
SHORT_SHA="${SHORT_SHA:0:7}"

notify_discord() {
  local title="$1" desc="$2" color="$3"
  if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
    return 0
  fi
  local payload
  payload=$(printf '{"embeds":[{"title":%s,"description":%s,"color":%s}]}' \
    "\"$title\"" "\"$desc\"" "$color")
  curl -fsS -X POST "$DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null 2>&1 || true
}

on_error() {
  notify_discord "❌ Déploiement staging échoué" \
    "Commit \`${SHORT_SHA}\` — voir les logs de \`lume-deploy-agent-staging\`." \
    15158332
}
trap on_error ERR

# Reclaim disk: removes images no longer referenced by a container (including
# stale :sha-xxxx staging tags), the BuildKit cache and stopped containers.
# Safe by design — never touches named volumes (Postgres data is preserved).
reclaim_disk() {
  echo "[deploy-staging] Reclaiming disk (unused images, build cache, stopped containers)"
  docker image prune -af >/dev/null 2>&1 || true
  docker builder prune -af >/dev/null 2>&1 || true
  docker container prune -f >/dev/null 2>&1 || true
}
# Run on every exit (success OR failure) so a deploy that crashes mid-pull —
# e.g. "no space left on device" — still frees space before the next attempt.
trap reclaim_disk EXIT

cd "${COMPOSE_PROJECT_DIR:-/workspace}"

PROJECT="${COMPOSE_PROJECT_NAME:-lumero-staging}"

if command -v git >/dev/null 2>&1 && [ -d .git ]; then
  echo "[deploy-staging] Updating working copy (git pull --ff-only origin develop)"
  git config --global --add safe.directory "$(pwd)" 2>/dev/null || true
  git pull --ff-only origin develop || \
    echo "[deploy-staging] WARN: git pull failed; building from existing working copy" >&2
fi

notify_discord "🧪 Déploiement staging en cours" \
  "Commit \`${SHORT_SHA}\` — pull de l'image + redémarrage de \`lume-app-staging\`." \
  10181046

# Free space BEFORE pulling the new image so the extraction does not fail with
# "no space left on device" on a disk clogged by previous deploys.
reclaim_disk

echo "[deploy-staging] Project: $PROJECT  Image: $IMAGE"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.staging.yml pull app

echo "[deploy-staging] Recreating app container (entrypoint runs migrate deploy)"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.staging.yml up -d --no-deps --force-recreate app

# Wait for the app to report healthy before seeding so migrations have applied.
echo "[deploy-staging] Waiting for app health"
for _ in $(seq 1 30); do
  if docker compose -p "$PROJECT" -f docker-compose.staging.yml exec -T app \
      wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health; then
    break
  fi
  sleep 2
done

# Seed is idempotent (upsert-based), safe to run on every deploy.
echo "[deploy-staging] Seeding database"
IMAGE="$IMAGE" docker compose -p "$PROJECT" -f docker-compose.staging.yml run --rm --no-deps app npm run db:seed || \
  echo "[deploy-staging] WARN: seed failed (deploy still succeeded)" >&2

# Rebuild + recreate the preview-orchestrator from the local working copy (built
# on the VM, not pulled from a registry) so code changes take effect, exactly
# like the prod deploy. The Docker layer cache makes this a near no-op when its
# sources are unchanged.
echo "[deploy-staging] Rebuilding preview-orchestrator"
docker compose -p "$PROJECT" -f docker-compose.staging.yml build preview-orchestrator

echo "[deploy-staging] Recreating preview-orchestrator container"
docker compose -p "$PROJECT" -f docker-compose.staging.yml up -d --no-deps --force-recreate preview-orchestrator

# Ensure the observability stack (Loki + Promtail + Grafana) is running.
echo "[deploy-staging] Ensuring observability stack (loki/promtail/grafana)"
docker compose -p "$PROJECT" -f docker-compose.staging.yml up -d loki promtail grafana

# Note: the staging tunnel is managed remotely (Cloudflare dashboard), so the
# Grafana route (logs-dev.lumero.fr → grafana:3000) is a Public Hostname added
# in the dashboard — no cloudflared restart needed here.

notify_discord "✅ Déploiement staging terminé" \
  "Commit \`${SHORT_SHA}\` est en ligne sur l'environnement de test." \
  3066993

trap - ERR
echo "[deploy-staging] Done."
