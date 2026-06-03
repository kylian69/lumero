import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isStripeEnabled, getStripe, appBaseUrl } from "@/lib/stripe";
import { ensureStripeCustomer } from "@/lib/billing";
import { setupFeeCents, PLAN_LABELS } from "@/lib/pricing";

const schema = z.object({ projectId: z.string().min(1) });

// Crée une session Stripe Checkout pour le paiement unique (setup) d'un projet.
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

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: { user: true },
  });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
  if (project.setupPaidAt) {
    return NextResponse.json(
      { error: "Ce site a déjà été réglé." },
      { status: 400 },
    );
  }

  const amount = setupFeeCents(project.planType);
  if (amount <= 0) {
    return NextResponse.json(
      { error: "Aucun montant à régler pour cette formule." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(project.user);
  const description = `Création du site — formule ${PLAN_LABELS[project.planType]} (${project.name})`;

  const payment = await prisma.payment.create({
    data: {
      userId: project.userId,
      projectId: project.id,
      kind: "SETUP",
      status: "PENDING",
      amount,
      description,
    },
  });

  const base = appBaseUrl();
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    locale: "fr",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: { name: description },
        },
      },
    ],
    invoice_creation: { enabled: true },
    metadata: {
      kind: "SETUP",
      userId: project.userId,
      projectId: project.id,
      paymentId: payment.id,
    },
    payment_intent_data: {
      metadata: { paymentId: payment.id, projectId: project.id },
    },
    success_url: `${base}/portal/billing?paid=1`,
    cancel_url: `${base}/portal/project?canceled=1`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: checkout.id },
  });

  return NextResponse.json({ url: checkout.url });
}
