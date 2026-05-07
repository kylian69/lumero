import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email/client";
import { passwordResetTemplate } from "@/lib/email/templates";
import { logActivity } from "@/lib/accounts";

const schema = z.object({ email: z.string().email().max(200) });
const TTL_MINUTES = 30;

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  // Always return ok to avoid email enumeration.
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (user && user.passwordHash) {
    // Invalidate previous unused reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    const token = generateToken(32);
    const tokenHash = hashToken(token);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
      },
    });
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
    const tpl = passwordResetTemplate({ resetUrl, email });
    await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });

    await logActivity({
      userId: user.id,
      entityType: "user",
      entityId: user.id,
      action: "password_reset_requested",
    });
  }

  return NextResponse.json({ ok: true });
}
