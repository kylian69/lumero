import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { monthlyAmountCents } from "@/lib/pricing";

const patchSchema = z.object({
  tier: z.enum(["NONE", "LIGHT", "COMPLETE"]).optional(),
  status: z.enum(["ACTIVE", "PAST_DUE", "CANCELED", "PAUSED"]).optional(),
  monthlyAmount: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const existing = await prisma.subscription.findUnique({
    where: { id },
    include: { project: { select: { planType: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (d.tier !== undefined) data.tier = d.tier;
  // Si le palier change sans montant explicite, on l'aligne sur la formule du projet.
  if (d.tier !== undefined && d.monthlyAmount === undefined) {
    data.monthlyAmount = monthlyAmountCents(existing.project.planType, d.tier);
  }
  if (d.status !== undefined) {
    data.status = d.status;
    if (d.status === "CANCELED" && !existing.canceledAt) {
      data.canceledAt = new Date();
    }
    if (d.status !== "CANCELED" && existing.canceledAt) {
      data.canceledAt = null;
    }
  }
  if (d.monthlyAmount !== undefined) data.monthlyAmount = d.monthlyAmount;
  if (d.currency !== undefined) data.currency = d.currency;
  if (d.currentPeriodEnd !== undefined) {
    const date = new Date(d.currentPeriodEnd);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "currentPeriodEnd invalide" },
        { status: 400 },
      );
    }
    data.currentPeriodEnd = date;
  }

  const subscription = await prisma.subscription.update({
    where: { id },
    data,
  });

  await logActivity({
    userId: session.user.id,
    entityType: "subscription",
    entityId: subscription.id,
    action: "updated",
    metadata: data,
  });

  return NextResponse.json({ ok: true, subscription });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
  }
  await prisma.subscription.delete({ where: { id } });
  await logActivity({
    userId: session.user.id,
    entityType: "subscription",
    entityId: id,
    action: "deleted",
  });
  return NextResponse.json({ ok: true });
}
