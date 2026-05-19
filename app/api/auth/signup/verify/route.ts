import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/accounts";
import { hashToken } from "@/lib/auth-tokens";

const schema = z.object({ token: z.string().min(20).max(200) });

async function lookup(token: string) {
  const tokenHash = hashToken(token);
  return prisma.signupToken.findUnique({ where: { tokenHash } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  if (!token) {
    return NextResponse.json({ valid: false, error: "Token manquant." });
  }
  const record = await lookup(token);
  if (!record || record.usedAt) {
    return NextResponse.json({ valid: false, error: "Lien invalide ou déjà utilisé." });
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Lien expiré." });
  }
  return NextResponse.json({ valid: true, email: record.email });
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Token invalide." }, { status: 400 });
  }
  const record = await lookup(parsed.data.token);
  if (!record || record.usedAt) {
    return NextResponse.json(
      { error: "Lien invalide ou déjà utilisé." },
      { status: 400 },
    );
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien expiré." }, { status: 400 });
  }

  const email = record.email;
  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      emailVerified: true,
      _count: { select: { projects: true } },
    },
  });

  // Re-check activity at consumption time (race / takeover safety)
  if (
    existing &&
    (existing._count.projects > 0 ||
      (existing.passwordHash && existing.emailVerified))
  ) {
    await prisma.signupToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return NextResponse.json(
      { error: "Un compte actif existe déjà pour cette adresse." },
      { status: 409 },
    );
  }

  let userId: string;
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: record.passwordHash,
        name: record.name ?? undefined,
        emailVerified: new Date(),
        mustChangePassword: false,
      },
    });
    userId = existing.id;
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name: record.name,
        passwordHash: record.passwordHash,
        role: "CLIENT",
        emailVerified: new Date(),
        mustChangePassword: false,
      },
    });
    userId = created.id;
  }

  await prisma.signupToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  // Clean up other pending signup tokens for this email
  await prisma.signupToken.deleteMany({
    where: { email, usedAt: null },
  });

  await logActivity({
    userId,
    entityType: "user",
    entityId: userId,
    action: existing ? "signup_claimed_empty" : "signup_completed",
  });

  return NextResponse.json({ ok: true, email });
}
