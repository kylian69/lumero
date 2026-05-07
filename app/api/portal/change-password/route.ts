import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { passwordChangedTemplate } from "@/lib/email/templates";

const schema = z.object({
  newPassword: z.string().min(8, "8 caractères minimum"),
});

// Endpoint dédié au changement de mot de passe forcé (première connexion).
// Ne vérifie pas le mot de passe actuel mais exige mustChangePassword === true.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }
  if (!user.mustChangePassword) {
    return NextResponse.json(
      { error: "Ce changement de mot de passe n'est pas requis" },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalide" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
    },
  });

  const tpl = passwordChangedTemplate();
  await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  return NextResponse.json({ ok: true });
}
