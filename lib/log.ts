import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { evaluateTriggers } from "@/lib/triggers";
import type { LogLevel, LogCategory } from "@prisma/client";

export type { LogLevel, LogCategory } from "@prisma/client";

/**
 * Point d'entrée unique pour journaliser une action « métier / audit ».
 *
 * Tout passe par ici : la fonction historique `logActivity` (lib/accounts.ts)
 * délègue à `recordLog`, de sorte que l'ensemble des ~70 appels existants
 * bénéficient automatiquement de la centralisation, de la catégorisation, des
 * niveaux de sévérité et des déclencheurs (alertes/notifications).
 */
export type RecordLogInput = {
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
  level?: LogLevel;
  category?: LogCategory;
  message?: string;
  ip?: string | null;
  userAgent?: string | null;
  /** Extrait automatiquement IP + user-agent depuis la requête. */
  request?: Request;
  /** Empêche le ré-déclenchement (utilisé par les triggers eux-mêmes). */
  skipTriggers?: boolean;
};

export type LoggedEvent = {
  id: string;
  userId: string | null;
  level: LogLevel;
  category: LogCategory;
  entityType: string;
  entityId: string;
  action: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
};

// Déduit une catégorie logique à partir du type d'entité.
const ENTITY_CATEGORY: Record<string, LogCategory> = {
  prospect: "CRM",
  questionnaire: "CRM",
  quote: "CRM",
  contact: "CRM",
  client: "ACCOUNT",
  user: "ACCOUNT",
  account: "ACCOUNT",
  invitation: "ACCOUNT",
  auth: "AUTH",
  login: "AUTH",
  session: "AUTH",
  project: "PROJECT",
  preview: "PROJECT",
  subscription: "BILLING",
  payment: "BILLING",
  invoice: "BILLING",
  billing: "BILLING",
  ticket: "SUPPORT",
  customization: "CUSTOMIZATION",
  system: "SYSTEM",
};

export function categoryForEntity(entityType: string): LogCategory {
  return ENTITY_CATEGORY[entityType] ?? "GENERAL";
}

/** Extrait l'adresse IP cliente depuis les en-têtes d'une requête. */
export function ipFromRequest(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

export function userAgentFromRequest(req: Request): string | null {
  return req.headers.get("user-agent");
}

export async function recordLog(input: RecordLogInput): Promise<LoggedEvent | null> {
  let userId = input.userId ?? null;
  if (userId) {
    const exists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) userId = null;
  }

  const level: LogLevel = input.level ?? "INFO";
  const category: LogCategory =
    input.category ?? categoryForEntity(input.entityType);
  const ip = input.ip ?? (input.request ? ipFromRequest(input.request) : null);
  const userAgent =
    input.userAgent ?? (input.request ? userAgentFromRequest(input.request) : null);

  let created;
  try {
    created = await prisma.activityLog.create({
      data: {
        userId,
        level,
        category,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        message: input.message ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    // La journalisation ne doit JAMAIS casser le flux applicatif.
    logger.error("failed to persist activity log", {
      err,
      action: input.action,
      entityType: input.entityType,
    });
    return null;
  }

  // Miroir technique sur stdout/stderr (structuré, agrégeable).
  const techLevel =
    level === "ERROR" ? "error" : level === "WARN" ? "warn" : level === "SECURITY" ? "warn" : "info";
  logger[techLevel](`${category}:${input.action}`, {
    logId: created.id,
    level,
    entityType: input.entityType,
    entityId: input.entityId,
    userId,
    ...(input.message ? { message: input.message } : {}),
  });

  const event: LoggedEvent = {
    id: created.id,
    userId,
    level,
    category,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    message: input.message ?? null,
    metadata: input.metadata ?? null,
    ip,
    userAgent,
    createdAt: created.createdAt,
  };

  if (!input.skipTriggers) {
    // Les déclencheurs ne doivent pas bloquer ni faire échouer l'appelant.
    evaluateTriggers(event).catch((err) =>
      logger.error("trigger evaluation failed", { err, logId: event.id }),
    );
  }

  return event;
}
