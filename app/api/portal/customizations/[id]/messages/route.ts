import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const attachmentInput = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
});
const schema = z.object({
  content: z.string().min(1),
  attachments: z.array(attachmentInput).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const request = await prisma.customizationRequest.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!request) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }
  const message = await prisma.customizationMessage.create({
    data: {
      requestId: id,
      authorId: session.user.id,
      content: parsed.data.content,
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
  await prisma.customizationRequest.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json({ ok: true, message });
}
