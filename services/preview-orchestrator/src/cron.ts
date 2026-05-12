import cron from "node-cron";
import { config } from "./config";
import { storage } from "./storage";
import { stop } from "./lifecycle";

export function startIdleShutdownCron() {
  cron.schedule(config.IDLE_SHUTDOWN_CRON, async () => {
    const threshold = Date.now() - config.IDLE_SHUTDOWN_DAYS * 24 * 60 * 60 * 1000;
    const idle = storage.runningIdleBefore(threshold);
    if (idle.length === 0) return;

    console.log(
      `[cron] auto-shutdown: stopping ${idle.length} idle preview(s) inactive since >${config.IDLE_SHUTDOWN_DAYS}d`
    );
    for (const preview of idle) {
      try {
        await stop(preview);
      } catch (err) {
        console.error(`[cron] failed to stop ${preview.slug}:`, err);
      }
    }
  });

  console.log(
    `[cron] idle-shutdown cron registered (${config.IDLE_SHUTDOWN_CRON}, ` +
      `threshold ${config.IDLE_SHUTDOWN_DAYS}d)`
  );
}
