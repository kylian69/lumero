import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import { ticketMessageToAdminsTemplate } from "@/lib/email/templates";
import { nextTicketNumber } from "@/lib/ticket-number";
import { formatEUR } from "@/lib/format";
import { isStripeEnabled, getStripe } from "@/lib/stripe";

const cancelSchema = z.object({
  reason: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = cancelSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!subscription || subscription.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
  }
  if (subscription.status === "CANCELED") {
    return NextResponse.json(
      { error: "Cet abonnement est déjà annulé." },
      { status: 400 },
    );
  }

  const tierLabel = subscription.tier === "LIGHT" ? "Light" : "Complet";
  const reason = parsed.data.reason?.trim();

  // Annule l'abonnement côté Stripe (best-effort) si un identifiant existe.
  if (isStripeEnabled() && subscription.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch (err) {
      console.error("[stripe] échec annulation abonnement", err);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });

    const number = await nextTicketNumber();
    const content = [
      `Demande d'annulation de l'abonnement (formule ${tierLabel}, ${formatEUR(
        subscription.monthlyAmount,
      )} / mois).`,
      reason ? `\nMotif communiqué par le client :\n${reason}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const ticket = await tx.supportTicket.create({
      data: {
        number,
        authorId: session.user.id,
        subject: `Annulation de l'abonnement (${tierLabel})`,
        category: "FACTURATION",
        priority: "NORMAL",
        status: "OPEN",
        projectId: subscription.projectId,
        messages: {
          create: {
            authorId: session.user.id,
            content,
          },
        },
      },
    });

    return { updated, ticket, content };
  });

  await logActivity({
    userId: session.user.id,
    entityType: "subscription",
    entityId: subscription.id,
    action: "canceled",
    metadata: { ticketId: result.ticket.id },
  });

  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0) {
    const tpl = ticketMessageToAdminsTemplate({
      ticketId: result.ticket.id,
      subject: result.ticket.subject,
      isNewTicket: true,
      content: result.content,
      clientEmail: session.user.email,
      clientName: session.user.name,
    });
    await sendEmail({ to: adminEmails, ...tpl, replyTo: session.user.email });
  }

  return NextResponse.json({ ok: true, ticketId: result.ticket.id });
}
