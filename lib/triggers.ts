import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import {
  securityAlertTemplate,
  paymentAlertTemplate,
  adminNotificationTemplate,
} from "@/lib/email/templates";
import type { LoggedEvent } from "@/lib/log";
import { recordLog } from "@/lib/log";

/**
 * Moteur de déclencheurs : exploite les journaux pour agir automatiquement.
 *
 * Trois familles activées :
 *   - Alertes sécurité   (échecs de connexion répétés, évènements SECURITY)
 *   - Alertes paiement   (échecs de facturation / paiement)
 *   - Notifications admin (évènements métier importants : conversion, ticket urgent)
 *
 * Chaque évènement journalisé via lib/log.ts est passé à `evaluateTriggers`.
 * Les alertes générées sont elles-mêmes journalisées (avec skipTriggers pour
 * éviter toute récursion).
 */

const LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAIL_THRESHOLD = 5;

async function notifyAdmins(template: {
  subject: string;
  html: string;
  text: string;
}) {
  const admins = await getAdminEmails();
  if (admins.length === 0) {
    logger.warn("trigger alert not sent: no admin recipients", {
      subject: template.subject,
    });
    return;
  }
  await sendEmail({ to: admins, ...template });
}

function metaEmail(event: LoggedEvent): string | null {
  const v = event.metadata?.email;
  return typeof v === "string" ? v : null;
}

async function handleFailedLogin(event: LoggedEvent) {
  const since = new Date(Date.now() - LOGIN_FAIL_WINDOW_MS);
  const recent = await prisma.activityLog.findMany({
    where: { action: "login_failed", createdAt: { gte: since } },
    select: { ip: true, metadata: true },
  });

  const email = metaEmail(event);
  const matches = recent.filter((r) => {
    if (event.ip && r.ip && r.ip === event.ip) return true;
    if (email && r.metadata) {
      try {
        return (JSON.parse(r.metadata) as { email?: string }).email === email;
      } catch {
        return false;
      }
    }
    return false;
  });

  // On alerte une seule fois, au moment précis où le seuil est franchi.
  if (matches.length !== LOGIN_FAIL_THRESHOLD) return;

  const subject = email ?? event.ip ?? "cible inconnue";
  await recordLog({
    level: "SECURITY",
    category: "AUTH",
    entityType: "auth",
    entityId: event.ip ?? email ?? "unknown",
    action: "brute_force_suspected",
    message: `${matches.length} échecs de connexion en moins de 15 min pour ${subject}`,
    metadata: { email, ip: event.ip, count: matches.length },
    skipTriggers: true,
  });

  await notifyAdmins(
    securityAlertTemplate({
      title: "Tentatives de connexion répétées",
      summary: `${matches.length} échecs de connexion en moins de 15 minutes.`,
      details: {
        Compte: email,
        "Adresse IP": event.ip,
        "Fenêtre": "15 minutes",
      },
    }),
  );
}

async function handleSecurityEvent(event: LoggedEvent) {
  await notifyAdmins(
    securityAlertTemplate({
      title: event.action.replace(/_/g, " "),
      summary: event.message ?? `Évènement de sécurité : ${event.action}`,
      details: {
        "Adresse IP": event.ip,
        "User-Agent": event.userAgent,
        Entité: `${event.entityType}#${event.entityId}`,
      },
    }),
  );
}

async function handlePaymentIssue(event: LoggedEvent) {
  await notifyAdmins(
    paymentAlertTemplate({
      title: event.action.replace(/_/g, " "),
      summary: event.message ?? `Incident de paiement : ${event.action}`,
      details: {
        Entité: `${event.entityType}#${event.entityId}`,
        Montant:
          typeof event.metadata?.amount === "number"
            ? String(event.metadata.amount)
            : null,
      },
    }),
  );
}

async function handleAdminNotification(event: LoggedEvent, title: string, ctaUrl?: string) {
  await notifyAdmins(
    adminNotificationTemplate({
      title,
      summary: event.message ?? title,
      details: { Entité: `${event.entityType}#${event.entityId}` },
      ctaUrl,
    }),
  );
}

const PAYMENT_FAILURE_ACTIONS = new Set([
  "payment_failed",
  "invoice_payment_failed",
  "checkout_failed",
  "charge_failed",
]);

export async function evaluateTriggers(event: LoggedEvent): Promise<void> {
  // ── Sécurité ───────────────────────────────────────────────
  if (event.action === "login_failed") {
    await handleFailedLogin(event);
  }
  // Tout évènement explicitement marqué SECURITY (hors ceux générés ici).
  if (event.level === "SECURITY" && event.action !== "brute_force_suspected") {
    await handleSecurityEvent(event);
  }

  // ── Paiement ───────────────────────────────────────────────
  if (
    event.category === "BILLING" &&
    (PAYMENT_FAILURE_ACTIONS.has(event.action) ||
      (event.level === "ERROR" && /fail/i.test(event.action)))
  ) {
    await handlePaymentIssue(event);
  }

  // ── Notifications admin ────────────────────────────────────
  if (event.entityType === "prospect" && event.action === "converted_to_client") {
    await handleAdminNotification(
      event,
      "Prospect converti en client",
      `${process.env.NEXTAUTH_URL || ""}/admin/clients`,
    );
  }
  if (
    event.entityType === "ticket" &&
    event.action === "created" &&
    event.metadata?.priority === "URGENT"
  ) {
    await handleAdminNotification(
      event,
      "Nouveau ticket support URGENT",
      `${process.env.NEXTAUTH_URL || ""}/admin/support`,
    );
  }
}
