import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveAttachmentPath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const att = await prisma.customizationAttachment.findUnique({
    where: { id },
    include: {
      message: {
        select: {
          isInternal: true,
          deletedAt: true,
          request: { select: { userId: true } },
        },
      },
    },
  });
  if (!att) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin) {
    if (att.message.isInternal) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (att.message.request.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (att.message.deletedAt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  try {
    const data = await fs.readFile(resolveAttachmentPath(att.storageKey));
    return new NextResponse(data, {
      headers: {
        "Content-Type": att.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(att.filename)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
