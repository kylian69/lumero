-- Drop the legacy Vercel column. The preview lifecycle is now handled by the
-- self-hosted preview-orchestrator; vercelProjectId is unused.
ALTER TABLE "Project" DROP COLUMN IF EXISTS "vercelProjectId";
