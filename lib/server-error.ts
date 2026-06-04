import { recordLog, type LogCategory } from "@/lib/log";
import { logger } from "@/lib/logger";

/**
 * Journalise une erreur serveur de façon centralisée (console technique +
 * persistance ERROR). À utiliser dans les blocs catch des routes API et des
 * tâches de fond pour qu'aucune exception ne se perde.
 */
export async function logServerError(
  err: unknown,
  context: {
    action?: string;
    message?: string;
    category?: LogCategory;
    entityType?: string;
    entityId?: string;
    userId?: string | null;
    metadata?: Record<string, unknown>;
    request?: Request;
  } = {},
): Promise<void> {
  const serialized =
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : { message: String(err) };

  logger.error(context.message ?? "unhandled server error", {
    err,
    action: context.action,
  });

  await recordLog({
    level: "ERROR",
    category: context.category ?? "SYSTEM",
    entityType: context.entityType ?? "system",
    entityId: context.entityId ?? "error",
    action: context.action ?? "unhandled_error",
    message: context.message ?? serialized.message,
    userId: context.userId ?? null,
    metadata: { error: serialized, ...context.metadata },
    request: context.request,
    skipTriggers: true,
  }).catch((e) => logger.error("failed to persist server error", { err: e }));
}
