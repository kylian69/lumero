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

  // Informational only: parent domain used by Lume to mint hostnames.
  // Kept for log readability; the orchestrator itself does not build hostnames.
  PREVIEW_BASE_DOMAIN: z.string().default("lumero.fr"),

  // Network on which preview containers are created so this orchestrator can
  // reach them by container name. Must already exist.
  PREVIEW_NETWORK: z.string().default("lumero_lume"),

  // Auto-shutdown idle previews after this many days.
  IDLE_SHUTDOWN_DAYS: z.coerce.number().default(3),

  // Cron expression for the idle check.
  IDLE_SHUTDOWN_CRON: z.string().default("0 * * * *"),

  // Default port the preview container is expected to listen on.
  PREVIEW_DEFAULT_PORT: z.coerce.number().default(3000),

  // Main Lumero app, reached server-to-server to authorize preview visitors.
  MAIN_APP_INTERNAL_URL: z.string().default("http://app:3000"),

  // Public URL of the main app, used to redirect unauthorized visitors to the
  // login / access-request page.
  MAIN_APP_PUBLIC_URL: z.string().default("https://lumero.fr"),

  // Optional per-preview DNS automation (used by staging, where the tunnel
  // can't own the *.lumero.fr wildcard). When all three are set, the
  // orchestrator creates/deletes a proxied CNAME per preview pointing at the
  // staging tunnel. Left empty in production, which relies on its wildcard.
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_TUNNEL_ID: z.string().optional(),
});

export const config = schema.parse(process.env);
export type Config = z.infer<typeof schema>;
