import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, logActivity } from "@/lib/accounts";
import { generateToken, hashToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email/client";
import { signupVerifyTemplate } from "@/lib/email/templates";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(120).optional(),
});

const TTL_MINUTES = 30;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email ou mot de passe invalide (8 caractères minimum)." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase().trim();
  const name = parsed.data.name?.trim() || null;

  // Check existing account state
  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      emailVerified: true,
      _count: { select: { projects: true, subscriptions: true } },
    },
  });

  if (existing) {
    const isActive =
      existing._count.projects > 0 ||
      existing._count.subscriptions > 0 ||
      (existing.passwordHash && existing.emailVerified);
    if (isActive) {
      // Real, active account: refuse to create a duplicate.
      return NextResponse.json(
        {
          error:
            "Un compte existe déjà avec cette adresse. Connectez-vous ou utilisez « mot de passe oublié ».",
        },
        { status: 409 },
      );
    }
    // Otherwise: empty / unverified account → allow takeover via email verification.
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const token = generateToken(32);
  const tokenHash = hashToken(token);

  // Invalidate any previous pending signup tokens for this email
  await prisma.signupToken.deleteMany({ where: { email, usedAt: null } });
  await prisma.signupToken.create({
    data: {
      email,
      tokenHash,
      passwordHash,
      name,
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
    },
  });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${base}/signup/verify?token=${encodeURIComponent(token)}`;
  const tpl = signupVerifyTemplate({ verifyUrl, email });
  await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  await logActivity({
    userId: existing?.id ?? null,
    entityType: "user",
    entityId: existing?.id ?? email,
    action: "signup_requested",
    metadata: { email },
  });

  return NextResponse.json({ ok: true });
}
