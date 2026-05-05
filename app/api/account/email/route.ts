import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  createVerificationCode,
  consumeVerificationCode,
} from "@/lib/verification";
import { sendEmail } from "@/lib/email/client";
import {
  emailChangeCodeTemplate,
  emailChangedNotifyTemplate,
} from "@/lib/email/templates";

const requestSchema = z.object({
  step: z.literal("request"),
  newEmail: z.string().email().max(190),
  currentPassword: z.string().min(1),
});

const confirmSchema = z.object({
  step: z.literal("confirm"),
  code: z.string().min(4).max(10),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const body = await req.json();

  if (body?.step === "request") {
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    const newEmail = parsed.data.newEmail.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Compte invalide" }, { status: 400 });
    }
    const passOk = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!passOk) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 400 },
      );
    }
    if (newEmail === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Adresse identique à l'actuelle" },
        { status: 400 },
      );
    }
    const taken = await prisma.user.findUnique({ where: { email: newEmail } });
    if (taken) {
      return NextResponse.json(
        { error: "Cette adresse est déjà utilisée" },
        { status: 400 },
      );
    }

    const code = await createVerificationCode({
      userId: user.id,
      type: "email_change",
      payload: newEmail,
      ttlMinutes: 15,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingEmail: newEmail },
    });
    const tpl = emailChangeCodeTemplate({ code, newEmail });
    await sendEmail({ to: newEmail, subject: tpl.subject, html: tpl.html, text: tpl.text });
    return NextResponse.json({ ok: true });
  }

  if (body?.step === "confirm") {
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }
    const result = await consumeVerificationCode({
      userId: session.user.id,
      type: "email_change",
      code: parsed.data.code,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const newEmail = result.payload;
    if (!newEmail) {
      return NextResponse.json({ error: "Aucune demande" }, { status: 400 });
    }
    const taken = await prisma.user.findUnique({ where: { email: newEmail } });
    if (taken && taken.id !== session.user.id) {
      return NextResponse.json(
        { error: "Cette adresse est déjà utilisée" },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: newEmail, pendingEmail: null, emailVerified: new Date() },
    });
    if (user?.email) {
      const tpl = emailChangedNotifyTemplate({ newEmail });
      await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    }
    return NextResponse.json({ ok: true });
  }

  if (body?.step === "cancel") {
    await prisma.verificationCode.deleteMany({
      where: { userId: session.user.id, type: "email_change" },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { pendingEmail: null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Étape inconnue" }, { status: 400 });
}
