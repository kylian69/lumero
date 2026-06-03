import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isStripeEnabled, getStripe, appBaseUrl } from "@/lib/stripe";
import { ensureStripeCustomer } from "@/lib/billing";
import { monthlyAmountCents, TIER_LABELS } from "@/lib/pricing";

const schema = z.object({
  projectId: z.string().min(1),
  tier: z.enum(["LIGHT", "COMPLETE"]),
});

// Crée une session Stripe Checkout (abonnement mensuel récurrent) pour un projet.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: "Le paiement en ligne n'est pas disponible pour le moment." },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const { projectId, tier } = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { user: true, subscriptions: true },
  });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const alreadyActive = project.subscriptions.find(
    (s) => s.status === "ACTIVE" && s.stripeSubscriptionId,
  );
  if (alreadyActive) {
    return NextResponse.json(
      { error: "Un abonnement est déjà actif pour ce site." },
      { status: 400 },
    );
  }

  const amount = monthlyAmountCents(project.planType, tier);
  if (amount <= 0) {
    return NextResponse.json(
      { error: "Montant d'abonnement invalide." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(project.user);
  const base = appBaseUrl();

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    locale: "fr",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          recurring: { interval: "month" },
          product_data: {
            name: `Abonnement ${TIER_LABELS[tier]} — ${project.name}`,
          },
        },
      },
    ],
    metadata: {
      kind: "SUBSCRIPTION",
      userId: project.userId,
      projectId: project.id,
      tier,
    },
    subscription_data: {
      metadata: { userId: project.userId, projectId: project.id, tier },
    },
    success_url: `${base}/portal/subscription?subscribed=1`,
    cancel_url: `${base}/portal/subscription?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url });
}
