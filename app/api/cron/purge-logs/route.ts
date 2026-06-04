import { NextResponse } from "next/server";
import { purgeOldLogs, RETENTION } from "@/lib/log-retention";
import { recordLog } from "@/lib/log";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Tâche planifiée de purge des journaux selon la politique de rétention.
 *
 * À déclencher périodiquement (cron) avec l'en-tête `x-cron-secret` :
 *   curl -H "x-cron-secret: $CRON_SECRET" https://app/api/cron/purge-logs
 *
 * L'orchestrateur (node-cron) ou tout planificateur externe peut l'appeler.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const result = await purgeOldLogs();
    await recordLog({
      level: "INFO",
      category: "SYSTEM",
      entityType: "system",
      entityId: "log-retention",
      action: "logs_purged",
      message: `Purge des journaux : ${result.total} entrée(s) supprimée(s)`,
      metadata: {
        ...result,
        infoDays: RETENTION.infoDays,
        auditDays: RETENTION.auditDays,
        durationMs: Date.now() - startedAt,
      },
      skipTriggers: true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("log purge failed", { err });
    await recordLog({
      level: "ERROR",
      category: "SYSTEM",
      entityType: "system",
      entityId: "log-retention",
      action: "logs_purge_failed",
      message: "Échec de la purge des journaux",
      metadata: { error: err instanceof Error ? err.message : String(err) },
      skipTriggers: true,
    }).catch(() => {});
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
