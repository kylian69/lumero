import { prisma } from "@/lib/prisma";

/**
 * Daily rate-limit for client-initiated preview starts. Counts
 * `preview_started` ActivityLog entries authored by the project owner in
 * the last 24h. Stops are always allowed (unlimited) so that a user can
 * always put their preview back to sleep — the last action they can take
 * is always a stop.
 */
export const PORTAL_PREVIEW_DAILY_START_LIMIT = 2;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function countPortalStartsLast24h(
  projectId: string,
  userId: string
): Promise<number> {
  const since = new Date(Date.now() - ONE_DAY_MS);
  return prisma.activityLog.count({
    where: {
      entityType: "project",
      entityId: projectId,
      action: "preview_started_portal",
      userId,
      createdAt: { gte: since },
    },
  });
}

export async function getPortalStartQuota(
  projectId: string,
  userId: string
): Promise<{
  limit: number;
  used: number;
  remaining: number;
  windowHours: number;
}> {
  const used = await countPortalStartsLast24h(projectId, userId);
  return {
    limit: PORTAL_PREVIEW_DAILY_START_LIMIT,
    used,
    remaining: Math.max(0, PORTAL_PREVIEW_DAILY_START_LIMIT - used),
    windowHours: 24,
  };
}
