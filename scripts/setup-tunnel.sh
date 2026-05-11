#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Cloudflare Tunnel — first-time setup on the production VM.
# Run ONCE as the user who owns the project directory.
#
# Prerequisites:
#   - Docker installed and running
#   - This script runs from the project root (where docker-compose.prod.yml is)
#   - Cloudflare account with lumero.fr already added and nameservers delegated
#
# Usage: bash scripts/setup-tunnel.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="lumero.fr"
TUNNEL_NAME="lume"
CF_DIR="./docker/cloudflare"
TUNNEL_YAML="$CF_DIR/tunnel.yaml"
CF_IMAGE="cloudflare/cloudflared:latest"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Cloudflare Tunnel setup for $DOMAIN"
echo "════════════════════════════════════════════════════════════"
echo ""

# ── Step 1: authenticate (opens a browser link) ──────────────────────────────
echo "Step 1/4 — Authenticate with Cloudflare"
echo "A URL will appear below. Open it in your browser to authorise the tunnel."
echo ""
docker run --rm -it \
  -v "$HOME/.cloudflared:/home/nonroot/.cloudflared" \
  "$CF_IMAGE" tunnel login

# ── Step 2: create the tunnel ────────────────────────────────────────────────
echo ""
echo "Step 2/4 — Creating tunnel '$TUNNEL_NAME'"
mkdir -p "$CF_DIR"

docker run --rm \
  -v "$HOME/.cloudflared:/home/nonroot/.cloudflared" \
  -v "$(pwd)/$CF_DIR:/output" \
  "$CF_IMAGE" tunnel create "$TUNNEL_NAME"

# cloudflared writes <uuid>.json inside /home/nonroot/.cloudflared
CREDENTIALS_SRC=$(find "$HOME/.cloudflared" -name "*.json" | head -1)
if [ -z "$CREDENTIALS_SRC" ]; then
  echo "ERROR: credentials JSON not found in ~/.cloudflared" >&2
  exit 1
fi

TUNNEL_ID=$(basename "$CREDENTIALS_SRC" .json)
echo "  Tunnel ID: $TUNNEL_ID"

# Copy credentials to project (gitignored)
cp "$CREDENTIALS_SRC" "$CF_DIR/credentials.json"
echo "  Credentials saved to $CF_DIR/credentials.json"

# ── Step 3: patch tunnel ID in tunnel.yaml ───────────────────────────────────
echo ""
echo "Step 3/4 — Updating tunnel.yaml with tunnel ID"
sed -i "s/TUNNEL_ID_PLACEHOLDER/$TUNNEL_ID/" "$TUNNEL_YAML"
echo "  Done."

# ── Step 4: create DNS CNAME records on Cloudflare ───────────────────────────
echo ""
echo "Step 4/4 — Creating DNS CNAME records (proxied via Cloudflare)"

for HOSTNAME in "$DOMAIN" "www.$DOMAIN" "deploy.$DOMAIN" "*.preview.$DOMAIN"; do
  echo "  → $HOSTNAME"
  docker run --rm \
    -v "$HOME/.cloudflared:/home/nonroot/.cloudflared" \
    "$CF_IMAGE" tunnel route dns "$TUNNEL_NAME" "$HOSTNAME" || \
    echo "    Warning: could not create DNS for $HOSTNAME (may already exist)"
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Fill in your .env (copy from .env.prod.example)"
echo "    2. docker login ghcr.io   (with a PAT if repo is private)"
echo "    3. docker compose -f docker-compose.prod.yml build deploy-agent"
echo "    4. docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  On GitHub (Settings → Actions):"
echo "    Variable  DEPLOY_WEBHOOK_URL = https://deploy.$DOMAIN/hooks/deploy-lume"
echo "    Secret    DEPLOY_WEBHOOK_SECRET = (value of WEBHOOK_SECRET in .env)"
echo "════════════════════════════════════════════════════════════"
