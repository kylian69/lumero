import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  ALLOWED_AVATAR_MIME,
  MAX_AVATAR_SIZE,
  deleteAvatar,
  saveAvatarFile,
} from "@/lib/avatars";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }
  if (!ALLOWED_AVATAR_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté (PNG, JPEG, WebP, GIF)" },
      { status: 400 },
    );
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json(
      { error: "Image trop lourde (2 Mo max)" },
      { status: 400 },
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await saveAvatarFile(session.user.id, buffer, file.name);

  const previous = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: key },
  });
  if (previous?.avatarUrl) {
    await deleteAvatar(previous.avatarUrl);
  }
  return NextResponse.json({ ok: true, avatarUrl: key });
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });
  if (user?.avatarUrl) await deleteAvatar(user.avatarUrl);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: null },
  });
  return NextResponse.json({ ok: true });
}
