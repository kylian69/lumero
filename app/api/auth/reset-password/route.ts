import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, logActivity } from "@/lib/accounts";
import { hashToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email/client";
import { passwordChangedTemplate } from "@/lib/email/templates";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(200),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  if (!token) {
    return NextResponse.json({ valid: false, error: "Token manquant." });
  }
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt) {
    return NextResponse.json({ valid: false, error: "Lien invalide ou déjà utilisé." });
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Lien expiré." });
  }
  return NextResponse.json({ valid: true });
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides (mot de passe min. 8 caractères)." },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record || record.usedAt) {
    return NextResponse.json(
      { error: "Lien invalide ou déjà utilisé." },
      { status: 400 },
    );
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien expiré." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other unused reset tokens for this user
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  const tpl = passwordChangedTemplate();
  await sendEmail({
    to: record.user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });

  await logActivity({
    userId: record.userId,
    entityType: "user",
    entityId: record.userId,
    action: "password_reset_completed",
  });

  return NextResponse.json({ ok: true });
}
