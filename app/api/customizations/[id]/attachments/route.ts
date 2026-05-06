import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  ALLOWED_MIME,
  MAX_ATTACHMENT_SIZE,
  saveScopedFile,
} from "@/lib/uploads";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const request = await prisma.customizationRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && request.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }
  const saved: Array<{
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;
  }> = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux: ${file.name}` },
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Type non autorisé: ${file.name}` },
        { status: 400 },
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const storageKey = await saveScopedFile(`c-${id}`, buf, file.name);
    saved.push({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      storageKey,
    });
  }
  return NextResponse.json({ ok: true, files: saved });
}
