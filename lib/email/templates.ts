import { formatEUR, formatDateTime } from "@/lib/format";

function appUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function escape(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string, ctaUrl?: string, ctaLabel?: string): string {
  const cta = ctaUrl
    ? `<p style="margin:24px 0;"><a href="${ctaUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;">${escape(ctaLabel || "Ouvrir")}</a></p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#f6f6f6;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:28px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:18px;color:#111;">${escape(title)}</h1>
          <div style="font-size:14px;line-height:1.6;color:#333;">${bodyHtml}</div>
          ${cta}
          <p style="margin-top:32px;color:#888;font-size:12px;">— Lume</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

type Template = { subject: string; html: string; text: string };

// ───────────────────────── Invitation ─────────────────────────

export function userInvitationTemplate(args: {
  inviteUrl: string;
  email: string;
  name?: string | null;
  role: string;
  invitedByName?: string | null;
}): Template {
  const greeting = args.name ? `Bonjour ${escape(args.name)},` : "Bonjour,";
  const inviter = args.invitedByName
    ? ` par <strong>${escape(args.invitedByName)}</strong>`
    : "";
  const subject = `Vous êtes invité·e à rejoindre Lume`;
  const html = layout(
    subject,
    `<p>${greeting}</p>
     <p>Vous avez été invité·e${inviter} à créer un compte sur Lume avec le rôle <strong>${escape(args.role)}</strong>.</p>
     <p>Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer votre compte. Ce lien expire dans 7 jours.</p>`,
    args.inviteUrl,
    "Activer mon compte",
  );
  const text = `Vous êtes invité·e à rejoindre Lume (${args.role}).\nActivez votre compte : ${args.inviteUrl}\nCe lien expire dans 7 jours.`;
  return { subject, html, text };
}

// ───────────────────────── Prospect ─────────────────────────

export function prospectCreatedTemplate(p: {
  id: string;
  companyName: string;
  email: string;
  phone?: string | null;
  source: string;
}): Template {
  const url = `${appUrl()}/admin/prospects/${p.id}`;
  const subject = `Nouveau prospect — ${p.companyName}`;
  const html = layout(
    subject,
    `<p>Un nouveau prospect vient d'arriver via <strong>${escape(p.source)}</strong>.</p>
     <ul>
       <li><strong>Société :</strong> ${escape(p.companyName)}</li>
       <li><strong>Email :</strong> ${escape(p.email)}</li>
       ${p.phone ? `<li><strong>Téléphone :</strong> ${escape(p.phone)}</li>` : ""}
     </ul>`,
    url,
    "Voir le prospect",
  );
  const text = `Nouveau prospect : ${p.companyName} (${p.email})\nSource : ${p.source}\n${url}`;
  return { subject, html, text };
}

// ───────────────────────── Quote ─────────────────────────

export function quoteRequestedTemplate(args: {
  prospectId: string;
  companyName: string;
  email: string;
  planType?: string | null;
  budgetCents?: number | null;
  timeline?: string | null;
  details?: string | null;
}): Template {
  const url = `${appUrl()}/admin/prospects/${args.prospectId}`;
  const subject = `Nouvelle demande de devis — ${args.companyName}`;
  const html = layout(
    subject,
    `<p><strong>${escape(args.companyName)}</strong> (${escape(args.email)}) a soumis une demande de devis.</p>
     <ul>
       ${args.planType ? `<li><strong>Plan :</strong> ${escape(args.planType)}</li>` : ""}
       ${args.budgetCents != null ? `<li><strong>Budget :</strong> ${formatEUR(args.budgetCents)}</li>` : ""}
       ${args.timeline ? `<li><strong>Délai souhaité :</strong> ${escape(args.timeline)}</li>` : ""}
     </ul>
     ${args.details ? `<p><strong>Détails :</strong></p><p style="white-space:pre-wrap;">${escape(args.details)}</p>` : ""}`,
    url,
    "Voir la demande",
  );
  const text = `Nouvelle demande de devis : ${args.companyName} (${args.email})\n${url}`;
  return { subject, html, text };
}

// ───────────────────────── Subscription ─────────────────────────

export function subscriptionCreatedTemplate(args: {
  subscriptionId: string;
  clientEmail: string;
  clientName?: string | null;
  tier: string;
  monthlyAmountCents: number;
  currentPeriodEnd: Date | string;
}): Template {
  const url = `${appUrl()}/admin/clients`;
  const subject = `Nouvel abonnement — ${args.clientName || args.clientEmail}`;
  const html = layout(
    subject,
    `<p>Un nouvel abonnement vient d'être créé.</p>
     <ul>
       <li><strong>Client :</strong> ${escape(args.clientName || args.clientEmail)} (${escape(args.clientEmail)})</li>
       <li><strong>Formule :</strong> ${escape(args.tier)}</li>
       <li><strong>Montant mensuel :</strong> ${formatEUR(args.monthlyAmountCents)}</li>
       <li><strong>Fin de période :</strong> ${formatDateTime(args.currentPeriodEnd)}</li>
     </ul>`,
    url,
    "Voir les clients",
  );
  const text = `Nouvel abonnement pour ${args.clientName || args.clientEmail} (${args.tier}, ${formatEUR(args.monthlyAmountCents)}/mois)\n${url}`;
  return { subject, html, text };
}

// ───────────────────────── Customization ─────────────────────────

export function customizationCreatedTemplate(args: {
  requestId: string;
  title: string;
  description: string;
  priority: string;
  clientEmail: string;
  clientName?: string | null;
}): Template {
  const url = `${appUrl()}/admin/customizations/${args.requestId}`;
  const subject = `Nouvelle demande de modif — ${args.title}`;
  const html = layout(
    subject,
    `<p><strong>${escape(args.clientName || args.clientEmail)}</strong> (${escape(args.clientEmail)}) a soumis une demande de personnalisation.</p>
     <ul>
       <li><strong>Titre :</strong> ${escape(args.title)}</li>
       <li><strong>Priorité :</strong> ${escape(args.priority)}</li>
     </ul>
     <p><strong>Description :</strong></p>
     <p style="white-space:pre-wrap;">${escape(args.description)}</p>`,
    url,
    "Voir la demande",
  );
  const text = `Nouvelle demande de modif de ${args.clientName || args.clientEmail} : ${args.title}\n${url}`;
  return { subject, html, text };
}

// ───────────────────────── Ticket → admins ─────────────────────────

export function ticketMessageToAdminsTemplate(args: {
  ticketId: string;
  subject: string;
  isNewTicket: boolean;
  content: string;
  clientEmail: string;
  clientName?: string | null;
}): Template {
  const url = `${appUrl()}/admin/tickets/${args.ticketId}`;
  const subject = args.isNewTicket
    ? `Nouveau ticket support — ${args.subject}`
    : `Nouvelle réponse client — ${args.subject}`;
  const html = layout(
    subject,
    `<p><strong>${escape(args.clientName || args.clientEmail)}</strong> (${escape(args.clientEmail)}) ${args.isNewTicket ? "a ouvert un nouveau ticket" : "a répondu à un ticket"}.</p>
     <p><strong>Sujet :</strong> ${escape(args.subject)}</p>
     <p><strong>Message :</strong></p>
     <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px;">${escape(args.content)}</p>`,
    url,
    "Répondre au ticket",
  );
  const text = `${args.isNewTicket ? "Nouveau ticket" : "Nouvelle réponse"} de ${args.clientName || args.clientEmail} sur "${args.subject}"\n${url}`;
  return { subject, html, text };
}

// ───────────────────────── Ticket → client ─────────────────────────

export function ticketMessageToClientTemplate(args: {
  ticketId: string;
  subject: string;
  content: string;
  authorName?: string | null;
}): Template {
  const url = `${appUrl()}/portal/support/${args.ticketId}`;
  const subject = `Réponse à votre ticket — ${args.subject}`;
  const html = layout(
    subject,
    `<p>L'équipe Lume vient de répondre à votre ticket <strong>${escape(args.subject)}</strong>.</p>
     <p><strong>Message :</strong></p>
     <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px;">${escape(args.content)}</p>`,
    url,
    "Voir le ticket",
  );
  const text = `Réponse de l'équipe Lume sur votre ticket "${args.subject}"\n${url}`;
  return { subject, html, text };
}

// ───────────────────────── Account ─────────────────────────

export function emailChangeCodeTemplate(args: {
  code: string;
  newEmail: string;
}): Template {
  const subject = "Confirmez votre nouvelle adresse email";
  const html = layout(
    subject,
    `<p>Vous avez demandé à modifier l'adresse email de votre compte Lume.</p>
     <p>Voici votre code de confirmation :</p>
     <p style="font-size:22px;font-weight:700;letter-spacing:4px;background:#f3f3f3;padding:12px 16px;border-radius:6px;display:inline-block;">${escape(args.code)}</p>
     <p style="color:#666;font-size:12px;">Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
  );
  const text = `Code de confirmation pour ${args.newEmail} : ${args.code} (valable 15 minutes).`;
  return { subject, html, text };
}

export function passwordChangedTemplate(): Template {
  const subject = "Votre mot de passe Lume a été modifié";
  const html = layout(
    subject,
    `<p>Le mot de passe de votre compte Lume vient d'être modifié.</p>
     <p>Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement.</p>`,
  );
  const text = "Le mot de passe de votre compte Lume a été modifié.";
  return { subject, html, text };
}

export function emailChangedNotifyTemplate(args: { newEmail: string }): Template {
  const subject = "Votre adresse email Lume a changé";
  const html = layout(
    subject,
    `<p>L'adresse email de votre compte Lume a été remplacée par <strong>${escape(args.newEmail)}</strong>.</p>
     <p>Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement.</p>`,
  );
  const text = `Votre adresse email a été remplacée par ${args.newEmail}.`;
  return { subject, html, text };
}
