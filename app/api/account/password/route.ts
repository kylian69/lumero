import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { passwordChangedTemplate } from "@/lib/email/templates";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "8 caractères minimum"),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalide" },
      { status: 400 },
    );
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Compte invalide" }, { status: 400 });
  }
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Mot de passe actuel incorrect" },
      { status: 400 },
    );
  }
  const same = await bcrypt.compare(parsed.data.newPassword, user.passwordHash);
  if (same) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit être différent" },
      { status: 400 },
    );
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  const tpl = passwordChangedTemplate();
  await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  return NextResponse.json({ ok: true });
}
