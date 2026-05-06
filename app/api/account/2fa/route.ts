import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildOtpAuthUrl, generateTotpSecret, verifyTotp } from "@/lib/totp";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  if (action === "setup") {
    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA déjà activée" }, { status: 400 });
    }
    const secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });
    const otpauth = buildOtpAuthUrl({ secret, label: user.email, issuer: "Lumero" });
    return NextResponse.json({ ok: true, secret, otpauth });
  }

  if (action === "enable") {
    const parsed = z.object({ code: z.string().min(6).max(6) }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }
    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Démarrez d'abord la configuration" },
        { status: 400 },
      );
    }
    const ok = verifyTotp(parsed.data.code, user.twoFactorSecret);
    if (!ok) return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "disable") {
    const parsed = z
      .object({ password: z.string().min(1) })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }
    if (!user.passwordHash) {
      return NextResponse.json({ error: "Compte invalide" }, { status: 400 });
    }
    const passOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passOk) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 400 },
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
