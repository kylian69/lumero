import { prisma } from "@/lib/prisma";

/**
 * Politique de rétention des journaux.
 *
 * Les évènements purement informatifs sont conservés à court terme, tandis que
 * les évènements à valeur d'audit/sécurité (WARN, ERROR, SECURITY) sont gardés
 * bien plus longtemps. Les valeurs sont surchargeables par variables
 * d'environnement.
 */
export const RETENTION = {
  infoDays: Number(process.env.LOG_RETENTION_INFO_DAYS ?? 90),
  auditDays: Number(process.env.LOG_RETENTION_AUDIT_DAYS ?? 365),
};

export type PurgeResult = {
  info: number;
  audit: number;
  total: number;
};

export async function purgeOldLogs(): Promise<PurgeResult> {
  const now = Date.now();
  const infoCutoff = new Date(now - RETENTION.infoDays * 86_400_000);
  const auditCutoff = new Date(now - RETENTION.auditDays * 86_400_000);

  const info = await prisma.activityLog.deleteMany({
    where: { level: "INFO", createdAt: { lt: infoCutoff } },
  });
  const audit = await prisma.activityLog.deleteMany({
    where: {
      level: { in: ["WARN", "ERROR", "SECURITY"] },
      createdAt: { lt: auditCutoff },
    },
  });

  return {
    info: info.count,
    audit: audit.count,
    total: info.count + audit.count,
  };
}
