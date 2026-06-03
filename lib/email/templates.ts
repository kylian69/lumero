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
          <p style="margin-top:32px;color:#888;font-size:12px;">— Lumero</p>
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

export function customizationMessageToAdminsTemplate(args: {
  requestId: string;
  title: string;
  content: string;
  clientEmail: string;
  clientName?: string | null;
}): Template {
  const url = `${appUrl()}/admin/customizations/${args.requestId}`;
  const subject = `Nouvelle réponse client — ${args.title}`;
  const html = layout(
    subject,
    `<p><strong>${escape(args.clientName || args.clientEmail)}</strong> (${escape(args.clientEmail)}) a répondu à une demande de personnalisation.</p>
     <p><strong>Demande :</strong> ${escape(args.title)}</p>
     <p><strong>Message :</strong></p>
     <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px;">${escape(args.content)}</p>`,
    url,
    "Voir la demande",
  );
  const text = `Nouvelle réponse de ${args.clientName || args.clientEmail} sur la personnalisation "${args.title}"\n${url}`;
  return { subject, html, text };
}

export function customizationMessageToClientTemplate(args: {
  requestId: string;
  title: string;
  content: string;
  authorName?: string | null;
}): Template {
  const url = `${appUrl()}/portal/customization/${args.requestId}`;
  const subject = `Réponse à votre demande de personnalisation — ${args.title}`;
  const html = layout(
    subject,
    `<p>L'équipe Lumero vient de répondre à votre demande de personnalisation <strong>${escape(args.title)}</strong>.</p>
     <p><strong>Message :</strong></p>
     <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px;">${escape(args.content)}</p>`,
    url,
    "Voir la demande",
  );
  const text = `Réponse de l'équipe Lumero sur votre demande de personnalisation "${args.title}"\n${url}`;
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
    `<p>L'équipe Lumero vient de répondre à votre ticket <strong>${escape(args.subject)}</strong>.</p>
     <p><strong>Message :</strong></p>
     <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px;">${escape(args.content)}</p>`,
    url,
    "Voir le ticket",
  );
  const text = `Réponse de l'équipe Lumero sur votre ticket "${args.subject}"\n${url}`;
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
    `<p>Vous avez demandé à modifier l'adresse email de votre compte Lumero.</p>
     <p>Voici votre code de confirmation :</p>
     <p style="font-size:22px;font-weight:700;letter-spacing:4px;background:#f3f3f3;padding:12px 16px;border-radius:6px;display:inline-block;">${escape(args.code)}</p>
     <p style="color:#666;font-size:12px;">Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
  );
  const text = `Code de confirmation pour ${args.newEmail} : ${args.code} (valable 15 minutes).`;
  return { subject, html, text };
}

export function passwordChangedTemplate(): Template {
  const subject = "Votre mot de passe Lumero a été modifié";
  const html = layout(
    subject,
    `<p>Le mot de passe de votre compte Lumero vient d'être modifié.</p>
     <p>Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement.</p>`,
  );
  const text = "Le mot de passe de votre compte Lumero a été modifié.";
  return { subject, html, text };
}

export function emailChangedNotifyTemplate(args: { newEmail: string }): Template {
  const subject = "Votre adresse email Lumero a changé";
  const html = layout(
    subject,
    `<p>L'adresse email de votre compte Lumero a été remplacée par <strong>${escape(args.newEmail)}</strong>.</p>
     <p>Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement.</p>`,
  );
  const text = `Votre adresse email a été remplacée par ${args.newEmail}.`;
  return { subject, html, text };
}

// ───────────────────────── Signup verification ─────────────────────────

export function signupVerifyTemplate(args: {
  verifyUrl: string;
  email: string;
}): Template {
  const subject = "Confirmez votre compte Lumero";
  const html = layout(
    subject,
    `<p>Bonjour,</p>
     <p>Vous venez de créer un compte Lumero avec l'adresse <strong>${escape(args.email)}</strong>.</p>
     <p>Pour finaliser la création, confirmez votre adresse email en cliquant sur le bouton ci-dessous. Ce lien expire dans 30 minutes et n'est utilisable qu'une seule fois.</p>
     <p style="color:#666;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
    args.verifyUrl,
    "Confirmer mon compte",
  );
  const text = `Confirmez votre compte Lumero (${args.email}) : ${args.verifyUrl}\nLien valable 30 minutes.`;
  return { subject, html, text };
}

export function passwordResetTemplate(args: {
  resetUrl: string;
  email: string;
}): Template {
  const subject = "Réinitialisation de votre mot de passe Lumero";
  const html = layout(
    subject,
    `<p>Bonjour,</p>
     <p>Une réinitialisation de mot de passe a été demandée pour le compte <strong>${escape(args.email)}</strong>.</p>
     <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 30 minutes et n'est utilisable qu'une seule fois.</p>
     <p style="color:#666;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message — votre mot de passe restera inchangé.</p>`,
    args.resetUrl,
    "Réinitialiser mon mot de passe",
  );
  const text = `Réinitialisez votre mot de passe Lumero : ${args.resetUrl}\nLien valable 30 minutes. Ignorez si vous n'êtes pas à l'origine de la demande.`;
  return { subject, html, text };
}

// ───────────────────────── Bienvenue prospect → compte créé ─────────────────────────

export function welcomeProspectTemplate(args: {
  companyName: string;
  email: string;
  tempPassword: string;
}): Template {
  const loginUrl = `${appUrl()}/login`;
  const subject = "Votre espace client Lumero est prêt";
  const html = layout(
    subject,
    `<p>Bonjour ${escape(args.companyName)},</p>
     <p>Merci pour votre questionnaire ! Nous avons créé votre espace client Lumero.</p>
     <p>Voici vos identifiants de connexion :</p>
     <ul>
       <li><strong>Email :</strong> ${escape(args.email)}</li>
       <li><strong>Mot de passe temporaire :</strong> <code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;font-family:monospace;">${escape(args.tempPassword)}</code></li>
     </ul>
     <p>Pour votre sécurité, vous devrez choisir un nouveau mot de passe lors de votre première connexion.</p>`,
    loginUrl,
    "Accéder à mon espace",
  );
  const text = `Bonjour ${args.companyName},\n\nVotre espace client Lumero a été créé.\n\nEmail : ${args.email}\nMot de passe temporaire : ${args.tempPassword}\n\nVous devrez choisir un nouveau mot de passe à la première connexion.\n\nConnectez-vous : ${loginUrl}`;
  return { subject, html, text };
}

// ───────────────────────── Formulaire de contact ─────────────────────────

export function contactMessageToAdminsTemplate(args: {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  attachmentCount?: number;
}): Template {
  const subjectLine = `Message de contact — ${args.subject}`;
  const html = layout(
    subjectLine,
    `<p><strong>${escape(args.senderName)}</strong> (${escape(args.senderEmail)}) vous a envoyé un message via le formulaire de contact.</p>
     <p><strong>Sujet :</strong> ${escape(args.subject)}</p>
     <p><strong>Message :</strong></p>
     <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px;">${escape(args.message)}</p>
     ${args.attachmentCount ? `<p style="color:#666;font-size:13px;">${args.attachmentCount} pièce(s) jointe(s) incluse(s).</p>` : ""}`,
  );
  const text = `Nouveau message de ${args.senderName} (${args.senderEmail})\nSujet : ${args.subject}\n\n${args.message}`;
  return { subject: subjectLine, html, text };
}

export function contactAutoReplyTemplate(args: {
  senderName: string;
  subject: string;
}): Template {
  const subject = `Votre message a bien été reçu — ${args.subject}`;
  const html = layout(
    subject,
    `<p>Bonjour ${escape(args.senderName)},</p>
     <p>Nous avons bien reçu votre message concernant <strong>${escape(args.subject)}</strong>.</p>
     <p>Notre équipe vous répondra dans les plus brefs délais, généralement sous 24 à 48 heures.</p>
     <p style="color:#666;font-size:12px;">Si vous n'êtes pas à l'origine de cet envoi, ignorez ce message.</p>`,
  );
  const text = `Bonjour ${args.senderName},\n\nNous avons bien reçu votre message "${args.subject}".\nNotre équipe vous répondra dans les plus brefs délais.`;
  return { subject, html, text };
}

// ───────────────────────── Preview publiée → client ─────────────────────────

export function previewPublishedTemplate(args: {
  clientName?: string | null;
  projectName: string;
  previewUrl: string;
}): Template {
  const portalUrl = `${appUrl()}/portal`;
  const greeting = args.clientName ? `Bonjour ${escape(args.clientName)},` : "Bonjour,";
  const subject = `Votre aperçu est prêt — ${args.projectName}`;
  const html = layout(
    subject,
    `<p>${greeting}</p>
     <p>Bonne nouvelle ! Une première version de votre site <strong>${escape(args.projectName)}</strong> est maintenant disponible en aperçu.</p>
     <p>Consultez-la et faites-nous part de vos retours directement depuis votre espace client.</p>
     <p style="margin:4px 0;"><a href="${escape(args.previewUrl)}" style="color:#555;font-size:13px;">${escape(args.previewUrl)}</a></p>`,
    portalUrl,
    "Voir mon aperçu",
  );
  const text = `${greeting}\n\nVotre aperçu "${args.projectName}" est prêt !\n\nConsultez-le : ${args.previewUrl}\n\nConnectez-vous à votre espace client pour nous faire part de vos retours : ${portalUrl}`;
  return { subject, html, text };
}

// ───────────────────────── Facturation ─────────────────────────

export function invoiceIssuedTemplate(args: {
  number: string;
  amountCents: number;
  description?: string | null;
  hostedInvoiceUrl?: string | null;
}): Template {
  const portalUrl = `${appUrl()}/portal/billing`;
  const subject = `Votre facture ${args.number} — Lumero`;
  const html = layout(
    subject,
    `<p>Bonjour,</p>
     <p>Nous vous confirmons la bonne réception de votre paiement. Votre facture est disponible.</p>
     <ul>
       <li><strong>Facture :</strong> ${escape(args.number)}</li>
       ${args.description ? `<li><strong>Objet :</strong> ${escape(args.description)}</li>` : ""}
       <li><strong>Montant :</strong> ${formatEUR(args.amountCents)}</li>
     </ul>
     ${
       args.hostedInvoiceUrl
         ? `<p style="margin:4px 0;"><a href="${escape(args.hostedInvoiceUrl)}" style="color:#555;font-size:13px;">Télécharger ma facture (PDF)</a></p>`
         : ""
     }
     <p>Vous retrouvez l'ensemble de vos factures dans votre espace client.</p>`,
    portalUrl,
    "Voir mes factures",
  );
  const text = `Votre facture ${args.number} (${formatEUR(args.amountCents)}) est disponible dans votre espace client : ${portalUrl}`;
  return { subject, html, text };
}
