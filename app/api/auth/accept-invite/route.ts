import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/accounts";
import { logActivity } from "@/lib/accounts";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides (mot de passe min. 8 caractères)." },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;
  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!inv || inv.acceptedAt) {
    return NextResponse.json(
      { error: "Invitation invalide ou déjà utilisée." },
      { status: 400 },
    );
  }
  if (inv.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expirée." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: inv.userId },
      data: { passwordHash, emailVerified: new Date() },
    }),
    prisma.invitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await logActivity({
    userId: inv.userId,
    entityType: "user",
    entityId: inv.userId,
    action: "invitation_accepted",
  });

  return NextResponse.json({ ok: true, email: inv.user.email });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }
  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: { user: { select: { email: true, name: true, role: true } } },
  });
  if (!inv) {
    return NextResponse.json({ valid: false, error: "Invitation introuvable." });
  }
  if (inv.acceptedAt) {
    return NextResponse.json({ valid: false, error: "Invitation déjà utilisée." });
  }
  if (inv.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Invitation expirée." });
  }
  return NextResponse.json({ valid: true, user: inv.user });
}
