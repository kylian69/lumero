const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

type EmailAttachment = {
  filename: string;
  content: Buffer;
  content_type?: string;
};

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

type Sender = { name?: string; email: string };

// Parse "Lumero <noreply@lumero.fr>" or "noreply@lumero.fr" into a Brevo sender.
function parseSender(value: string): Sender {
  const match = value.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    const name = match[1].trim();
    return name ? { name, email: match[2].trim() } : { email: match[2].trim() };
  }
  return { email: value.trim() };
}

// Journalise un échec d'envoi dans le pipeline central. Import dynamique pour
// éviter un cycle (log → triggers → email) et skipTriggers car alerter par
// email d'une panne d'email serait contre-productif.
async function logEmailFailure(
  subject: string,
  recipients: string[],
  detail: Record<string, unknown>,
) {
  try {
    const { recordLog } = await import("@/lib/log");
    await recordLog({
      level: "ERROR",
      category: "SYSTEM",
      entityType: "system",
      entityId: "email",
      action: "email_send_failed",
      message: `Échec d'envoi d'email : ${subject}`,
      metadata: { subject, recipients, ...detail },
      skipTriggers: true,
    });
  } catch {
    /* la journalisation ne doit jamais casser l'envoi */
  }
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const filtered = recipients.filter((r) => r && r.includes("@"));
  if (filtered.length === 0) {
    console.warn("[email] no valid recipients, skipping", { subject: params.subject });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] BREVO_API_KEY not set, skipping send to=${filtered.join(",")} subject="${params.subject}"`,
    );
    return;
  }

  const sender = parseSender(process.env.EMAIL_FROM || "Lumero <noreply@lumero.fr>");
  const replyToEmail = params.replyTo || process.env.EMAIL_REPLY_TO || undefined;

  const body: Record<string, unknown> = {
    sender,
    to: filtered.map((email) => ({ email })),
    subject: params.subject,
    htmlContent: params.html,
  };
  if (params.text) body.textContent = params.text;
  if (replyToEmail) body.replyTo = { email: replyToEmail };
  if (params.attachments?.length) {
    body.attachment = params.attachments.map((a) => ({
      name: a.filename,
      content: a.content.toString("base64"),
    }));
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[email] send failed", {
        to: filtered,
        subject: params.subject,
        status: res.status,
        detail,
      });
      await logEmailFailure(params.subject, filtered, { status: res.status, detail });
      return;
    }
    console.log(`[email] sent to=${filtered.join(",")} subject="${params.subject}"`);
  } catch (err) {
    console.error("[email] send threw", { to: filtered, subject: params.subject, err });
    await logEmailFailure(params.subject, filtered, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
