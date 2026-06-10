import cron from "node-cron";
import { config } from "./config";
import { storage } from "./storage";
import { stop } from "./lifecycle";
import { centralLog } from "./central-log";

export function startIdleShutdownCron() {
  cron.schedule(config.IDLE_SHUTDOWN_CRON, async () => {
    const threshold = Date.now() - config.IDLE_SHUTDOWN_DAYS * 24 * 60 * 60 * 1000;
    const idle = storage.runningIdleBefore(threshold);
    if (idle.length === 0) return;

    console.log(
      `[cron] auto-shutdown: stopping ${idle.length} idle preview(s) inactive since >${config.IDLE_SHUTDOWN_DAYS}d`
    );
    let stopped = 0;
    for (const preview of idle) {
      try {
        await stop(preview);
        stopped++;
      } catch (err) {
        console.error(`[cron] failed to stop ${preview.slug}:`, err);
        centralLog({
          level: "ERROR",
          category: "PROJECT",
          entityType: "preview",
          entityId: preview.slug,
          action: "preview_idle_stop_failed",
          message: `Échec d'arrêt automatique de la preview ${preview.slug}`,
          metadata: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    }
    centralLog({
      category: "SYSTEM",
      entityType: "system",
      entityId: "preview-idle-cron",
      action: "idle_shutdown_run",
      message: `Arrêt automatique : ${stopped}/${idle.length} preview(s) inactive(s) arrêtée(s)`,
      metadata: {
        candidates: idle.length,
        stopped,
        thresholdDays: config.IDLE_SHUTDOWN_DAYS,
      },
    });
  });

  console.log(
    `[cron] idle-shutdown cron registered (${config.IDLE_SHUTDOWN_CRON}, ` +
      `threshold ${config.IDLE_SHUTDOWN_DAYS}d)`
  );
}

/**
 * Periodically enforces the log-retention policy by calling the main app's
 * purge endpoint. Only active when CRON_SECRET is configured.
 */
export function startLogPurgeCron() {
  if (!config.CRON_SECRET) {
    console.log("[cron] log-purge cron disabled (no CRON_SECRET)");
    return;
  }
  cron.schedule(config.LOG_PURGE_CRON, async () => {
    try {
      const res = await fetch(`${config.MAIN_APP_INTERNAL_URL}/api/cron/purge-logs`, {
        method: "GET",
        headers: { "x-cron-secret": config.CRON_SECRET as string },
      });
      if (!res.ok) {
        console.error(`[cron] log purge HTTP ${res.status}`);
        return;
      }
      const body = (await res.json()) as { total?: number };
      console.log(`[cron] log purge done (${body.total ?? 0} removed)`);
    } catch (err) {
      console.error("[cron] log purge failed:", err);
    }
  });
  console.log(`[cron] log-purge cron registered (${config.LOG_PURGE_CRON})`);
}
