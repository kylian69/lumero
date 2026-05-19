import { prisma } from "@/lib/prisma";

export type ActivityEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: { id: string; name: string | null; email: string } | null;
};

type RawLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; email: string } | null;
};

function normalize(logs: RawLog[]): ActivityEntry[] {
  return logs.map((l) => {
    let metadata: Record<string, unknown> | null = null;
    if (l.metadata) {
      try {
        metadata = JSON.parse(l.metadata);
      } catch {
        metadata = null;
      }
    }
    return {
      id: l.id,
      entityType: l.entityType,
      entityId: l.entityId,
      action: l.action,
      metadata,
      createdAt: l.createdAt,
      user: l.user,
    };
  });
}

const userSelect = { id: true, name: true, email: true } as const;

export async function getProspectActivity(
  prospectId: string,
): Promise<ActivityEntry[]> {
  const logs = await prisma.activityLog.findMany({
    where: { entityType: "prospect", entityId: prospectId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: userSelect } },
  });
  return normalize(logs);
}

export async function getClientActivity(
  userId: string,
): Promise<ActivityEntry[]> {
  const [user, prospect, subs, tickets, customizations, projects] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.prospect.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      }),
      prisma.subscription.findMany({
        where: { project: { userId } },
        select: { id: true },
      }),
      prisma.supportTicket.findMany({
        where: { authorId: userId },
        select: { id: true },
      }),
      prisma.customizationRequest.findMany({
        where: { userId },
        select: { id: true },
      }),
      prisma.project.findMany({
        where: { userId },
        select: { id: true },
      }),
    ]);

  if (!user) return [];

  const filters: { entityType: string; entityId: { in: string[] } }[] = [
    { entityType: "client", entityId: { in: [userId] } },
  ];
  if (prospect) {
    filters.push({ entityType: "prospect", entityId: { in: [prospect.id] } });
  }
  if (subs.length) {
    filters.push({
      entityType: "subscription",
      entityId: { in: subs.map((s) => s.id) },
    });
  }
  if (tickets.length) {
    filters.push({
      entityType: "ticket",
      entityId: { in: tickets.map((t) => t.id) },
    });
  }
  if (customizations.length) {
    filters.push({
      entityType: "customization",
      entityId: { in: customizations.map((c) => c.id) },
    });
  }
  if (projects.length) {
    filters.push({
      entityType: "project",
      entityId: { in: projects.map((p) => p.id) },
    });
  }

  const logs = await prisma.activityLog.findMany({
    where: { OR: filters },
    orderBy: { createdAt: "desc" },
    include: { user: { select: userSelect } },
  });
  return normalize(logs);
}
