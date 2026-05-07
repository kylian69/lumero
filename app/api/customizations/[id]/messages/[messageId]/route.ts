import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const USER_EDIT_WINDOW_MS = 15 * 60 * 1000;

const attachmentInput = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
});

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  attachmentsToAdd: z.array(attachmentInput).optional(),
  attachmentsToRemove: z.array(z.string()).optional(),
});

async function loadContext(requestId: string, messageId: string) {
  return prisma.customizationMessage.findFirst({
    where: { id: messageId, requestId },
    include: { request: { select: { userId: true } } },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id, messageId } = await params;
  const message = await loadContext(id, messageId);
  if (!message || message.deletedAt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = message.authorId === session.user.id;
  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isAdmin) {
    if (message.request.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (Date.now() - message.createdAt.getTime() > USER_EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Délai de modification dépassé" },
        { status: 403 },
      );
    }
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }
  const { content, attachmentsToAdd, attachmentsToRemove } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (attachmentsToRemove?.length) {
      await tx.customizationAttachment.deleteMany({
        where: { id: { in: attachmentsToRemove }, messageId },
      });
    }
    if (attachmentsToAdd?.length) {
      await tx.customizationAttachment.createMany({
        data: attachmentsToAdd.map((a) => ({ ...a, messageId })),
      });
    }
    await tx.customizationMessage.update({
      where: { id: messageId },
      data: {
        ...(content !== undefined ? { content } : {}),
        editedAt: new Date(),
      },
    });
  });

  await logActivity({
    userId: session.user.id,
    entityType: "customization",
    entityId: id,
    action: "message_edited",
    metadata: { messageId, byAdmin: isAdmin },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id, messageId } = await params;
  const message = await loadContext(id, messageId);
  if (!message || message.deletedAt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = message.authorId === session.user.id;
  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isAdmin) {
    if (message.request.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (Date.now() - message.createdAt.getTime() > USER_EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Délai de suppression dépassé" },
        { status: 403 },
      );
    }
  }
  await prisma.customizationMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logActivity({
    userId: session.user.id,
    entityType: "customization",
    entityId: id,
    action: "message_deleted",
    metadata: { messageId, byAdmin: isAdmin },
  });
  return NextResponse.json({ ok: true });
}
