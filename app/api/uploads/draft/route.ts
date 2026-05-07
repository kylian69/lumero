import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  ALLOWED_MIME,
  MAX_ATTACHMENT_SIZE,
  saveScopedFile,
} from "@/lib/uploads";

// Generic upload endpoint used during the creation of a ticket / customization
// (when no parent resource exists yet). Files are stored under a per-user draft
// folder; the returned storageKey is later embedded in the message creation
// payload, which links them to a real attachment record.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  const scope = `_draft-${session.user.id}`;
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
    const storageKey = await saveScopedFile(scope, buf, file.name);
    saved.push({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      storageKey,
    });
  }

  return NextResponse.json({ ok: true, files: saved });
}
