import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import { customizationCreatedTemplate } from "@/lib/email/templates";

const attachmentInput = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
});

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
  projectId: z.string().optional(),
  attachments: z.array(attachmentInput).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const request = await prisma.customizationRequest.create({
    data: {
      userId: session.user.id,
      projectId: d.projectId ?? null,
      title: d.title,
      description: d.description,
      category: d.category ?? null,
      priority: d.priority,
      messages: {
        create: {
          authorId: session.user.id,
          content: d.description,
          ...(d.attachments?.length
            ? {
                attachments: {
                  create: d.attachments.map((a) => ({
                    filename: a.filename,
                    mimeType: a.mimeType,
                    size: a.size,
                    storageKey: a.storageKey,
                  })),
                },
              }
            : {}),
        },
      },
    },
  });
  await logActivity({
    userId: session.user.id,
    entityType: "customization",
    entityId: request.id,
    action: "created",
  });

  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0) {
    const tpl = customizationCreatedTemplate({
      requestId: request.id,
      title: request.title,
      description: request.description,
      priority: request.priority,
      clientEmail: session.user.email,
      clientName: session.user.name,
    });
    await sendEmail({ to: adminEmails, ...tpl });
  }

  return NextResponse.json({ ok: true, id: request.id });
}
