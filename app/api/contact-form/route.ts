import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import {
  contactMessageToAdminsTemplate,
  contactAutoReplyTemplate,
} from "@/lib/email/templates";
import { ALLOWED_MIME, MAX_ATTACHMENT_SIZE } from "@/lib/uploads";

const MAX_FILES = 5;

const fieldsSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide"),
  subject: z.string().min(1, "Le sujet est requis").max(200),
  message: z.string().min(10, "Le message doit faire au moins 10 caractères").max(5000),
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const parsed = fieldsSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { name, email, subject, message } = parsed.data;

    const rawFiles = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (rawFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} fichiers autorisés.` },
        { status: 400 },
      );
    }

    const attachments: Array<{ filename: string; content: Buffer; content_type: string }> = [];

    for (const file of rawFiles) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        return NextResponse.json(
          { error: `Fichier trop volumineux : ${file.name} (max 10 Mo).` },
          { status: 400 },
        );
      }
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé : ${file.name}.` },
          { status: 400 },
        );
      }
      attachments.push({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        content_type: file.type,
      });
    }

    const adminEmails = await getAdminEmails();

    if (adminEmails.length > 0) {
      const adminTpl = contactMessageToAdminsTemplate({
        senderName: name,
        senderEmail: email,
        subject,
        message,
        attachmentCount: attachments.length,
      });
      await sendEmail({
        to: adminEmails,
        replyTo: email,
        attachments,
        ...adminTpl,
      });
    }

    const replyTpl = contactAutoReplyTemplate({ senderName: name, subject });
    await sendEmail({ to: email, ...replyTpl });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/contact-form]", err);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
