import { config } from "./config";

/**
 * Ships structured events to the main Lumero app so that orchestrator activity
 * (preview builds, container lifecycle, errors) is centralized in the same
 * Postgres-backed log store as the rest of the platform.
 *
 * Fire-and-forget: shipping a log must never block nor break the orchestrator.
 */
type Level = "INFO" | "WARN" | "ERROR" | "SECURITY";
type Category = "PROJECT" | "SYSTEM";

export function centralLog(input: {
  level?: Level;
  category?: Category;
  action: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): void {
  const url = `${config.MAIN_APP_INTERNAL_URL}/api/internal/logs`;
  void fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-token": config.INTERNAL_API_TOKEN,
    },
    body: JSON.stringify({ source: "orchestrator", ...input }),
  }).catch((err) => {
    console.error(
      "[central-log] failed to ship log:",
      err instanceof Error ? err.message : err,
    );
  });
}
