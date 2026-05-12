#!/bin/bash
# Restore a Lume database from a backup file.
# Usage: bash scripts/restore-db.sh /backups/daily/lume-YYYY-MM-DD.sql.gz
#
# Run on the production VM, from /opt/lumero.
# WARNING: this drops the public schema before restoring.

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup-file-inside-postgres-backups-volume>" >&2
  echo "Example: $0 /backups/daily/lume-2026-05-12.sql.gz" >&2
  echo ""
  echo "List available backups:" >&2
  docker run --rm -v lumero_postgres-backups:/backups alpine ls -lh /backups/daily /backups/weekly /backups/monthly 2>/dev/null
  exit 1
fi

BACKUP="$1"

echo "⚠️  About to restore from: $BACKUP"
echo "    This will WIPE the current 'public' schema."
read -p "Type 'yes' to continue: " confirm
[ "$confirm" = "yes" ] || { echo "Aborted."; exit 1; }

set -a
. .env
set +a

echo "[restore] Dropping and recreating public schema..."
docker exec -i lume-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "[restore] Streaming backup into postgres..."
docker run --rm -i \
  -v lumero_postgres-backups:/backups \
  --network lumero_lume \
  -e PGPASSWORD="$POSTGRES_PASSWORD" \
  postgres:17-alpine \
  sh -c "gunzip -c '$BACKUP' | psql -h postgres -U '$POSTGRES_USER' -d '$POSTGRES_DB'"

echo "[restore] Done. Restart the app:"
echo "    docker compose -f docker-compose.prod.yml restart app"
