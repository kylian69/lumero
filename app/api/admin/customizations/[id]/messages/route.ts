import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { customizationMessageToClientTemplate } from "@/lib/email/templates";

const attachmentInput = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
});
const schema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().optional().default(false),
  attachments: z.array(attachmentInput).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }
  const message = await prisma.customizationMessage.create({
    data: {
      requestId: id,
      authorId: session.user.id,
      content: parsed.data.content,
      isInternal: parsed.data.isInternal,
      ...(parsed.data.attachments?.length
        ? {
            attachments: {
              create: parsed.data.attachments.map((a) => ({
                filename: a.filename,
                mimeType: a.mimeType,
                size: a.size,
                storageKey: a.storageKey,
              })),
            },
          }
        : {}),
    },
  });
  if (!parsed.data.isInternal) {
    await prisma.customizationRequest.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }
  await logActivity({
    userId: session.user.id,
    entityType: "customization",
    entityId: id,
    action: parsed.data.isInternal ? "internal_note" : "replied",
  });

  if (!parsed.data.isInternal) {
    const request = await prisma.customizationRequest.findUnique({
      where: { id },
      select: {
        title: true,
        user: { select: { email: true } },
      },
    });
    if (request?.user?.email) {
      const tpl = customizationMessageToClientTemplate({
        requestId: id,
        title: request.title,
        content: parsed.data.content,
        authorName: session.user.name,
      });
      await sendEmail({ to: request.user.email, ...tpl });
    }
  }

  return NextResponse.json({ ok: true, message });
}
