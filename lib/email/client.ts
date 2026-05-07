import { Resend } from "resend";

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

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

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const filtered = recipients.filter((r) => r && r.includes("@"));
  if (filtered.length === 0) {
    console.warn("[email] no valid recipients, skipping", { subject: params.subject });
    return;
  }

  const client = getClient();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY not set, skipping send to=${filtered.join(",")} subject="${params.subject}"`,
    );
    return;
  }

  const from = process.env.EMAIL_FROM || "Lumero <onboarding@resend.dev>";
  const replyTo = params.replyTo || process.env.EMAIL_REPLY_TO || undefined;

  try {
    const result = await client.emails.send({
      from,
      to: filtered,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        content_type: a.content_type,
      })),
    });
    if (result.error) {
      console.error("[email] send failed", {
        to: filtered,
        subject: params.subject,
        error: result.error,
      });
      return;
    }
    console.log(`[email] sent to=${filtered.join(",")} subject="${params.subject}"`);
  } catch (err) {
    console.error("[email] send threw", { to: filtered, subject: params.subject, err });
  }
}
