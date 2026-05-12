import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8080),
  DATA_DIR: z.string().default("/data"),

  // Internal API auth: Lume passes this in X-Internal-Token header.
  // Generate with: openssl rand -hex 32
  INTERNAL_API_TOKEN: z.string().min(16),

  // Shared HMAC secret for GitHub webhooks.
  GITHUB_WEBHOOK_SECRET: z.string().min(16),

  // GitHub PAT used to clone preview repos (must have `repo` scope on the org).
  GITHUB_TOKEN: z.string().min(1),

  // Base hostname for previews. Each preview lives at <slug>.PREVIEW_BASE_DOMAIN.
  PREVIEW_BASE_DOMAIN: z.string().default("preview.lumero.fr"),

  // Network on which preview containers are created so this orchestrator can
  // reach them by container name. Must already exist.
  PREVIEW_NETWORK: z.string().default("lumero_lume"),

  // Auto-shutdown idle previews after this many days.
  IDLE_SHUTDOWN_DAYS: z.coerce.number().default(3),

  // Cron expression for the idle check.
  IDLE_SHUTDOWN_CRON: z.string().default("0 * * * *"),

  // Default port the preview container is expected to listen on.
  PREVIEW_DEFAULT_PORT: z.coerce.number().default(3000),
});

export const config = schema.parse(process.env);
export type Config = z.infer<typeof schema>;
