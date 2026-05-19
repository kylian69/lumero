import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import { subscriptionCreatedTemplate } from "@/lib/email/templates";

const schema = z.object({
  projectId: z.string().min(1),
  tier: z.enum(["NONE", "LIGHT", "COMPLETE"]).default("LIGHT"),
  monthlyAmount: z.number().int().nonnegative(),
  currency: z.string().optional(),
  currentPeriodEnd: z.string(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const periodEnd = new Date(d.currentPeriodEnd);
  if (Number.isNaN(periodEnd.getTime())) {
    return NextResponse.json(
      { error: "currentPeriodEnd invalide" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: d.projectId },
    select: {
      id: true,
      name: true,
      user: { select: { email: true, name: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      projectId: d.projectId,
      tier: d.tier,
      monthlyAmount: d.monthlyAmount,
      currency: d.currency ?? "EUR",
      currentPeriodEnd: periodEnd,
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "subscription",
    entityId: subscription.id,
    action: "created",
    metadata: { tier: d.tier, monthlyAmount: d.monthlyAmount, projectId: d.projectId },
  });

  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0) {
    const tpl = subscriptionCreatedTemplate({
      subscriptionId: subscription.id,
      clientEmail: project.user.email,
      clientName: project.user.name,
      tier: d.tier,
      monthlyAmountCents: d.monthlyAmount,
      currentPeriodEnd: periodEnd,
    });
    await sendEmail({ to: adminEmails, ...tpl });
  }

  return NextResponse.json({ ok: true, subscription });
}
