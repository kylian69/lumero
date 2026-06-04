/**
 * Hook d'instrumentation Next.js (exécuté une fois au démarrage du serveur).
 *
 * - journalise le démarrage de l'application (catégorie SYSTEM) ;
 * - installe des gardes au niveau du process pour qu'aucune exception non
 *   gérée ne se perde silencieusement.
 */
export async function register() {
  // Ne s'exécute que dans le runtime Node.js (pas Edge).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { recordLog } = await import("@/lib/log");
  const { logServerError } = await import("@/lib/server-error");
  const { logger } = await import("@/lib/logger");

  await recordLog({
    level: "INFO",
    category: "SYSTEM",
    entityType: "system",
    entityId: "app",
    action: "app_started",
    message: `Application démarrée (${process.env.NODE_ENV ?? "unknown"})`,
    metadata: { node: process.version },
    skipTriggers: true,
  }).catch((err) => logger.error("failed to log app start", { err }));

  process.on("unhandledRejection", (reason) => {
    void logServerError(reason, {
      action: "unhandled_rejection",
      message: "Promesse rejetée non gérée",
    });
  });

  process.on("uncaughtException", (err) => {
    void logServerError(err, {
      action: "uncaught_exception",
      message: "Exception non interceptée",
    });
  });
}
