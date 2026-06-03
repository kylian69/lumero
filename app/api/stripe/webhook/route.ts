import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { nextInvoiceNumber, splitTtc } from "@/lib/billing";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { invoiceIssuedTemplate } from "@/lib/email/templates";

// La vérification de signature impose le corps brut : pas de parsing JSON ici.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Stripe disabled" }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET non configuré");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", secret);
  } catch (err) {
    console.error("[stripe] signature invalide", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, stripe);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe] erreur de traitement ${event.type}`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  const kind = session.metadata?.kind;

  if (kind === "SETUP") {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) return;
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === "PAID") return;

    const intentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripePaymentIntentId: intentId,
      },
    });
    if (payment.projectId) {
      await prisma.project.update({
        where: { id: payment.projectId },
        data: { setupPaidAt: new Date() },
      });
    }
    await createInternalInvoice({
      userId: payment.userId,
      projectId: payment.projectId,
      paymentId: payment.id,
      kind: "SETUP",
      amountTtc: payment.amount,
      description: payment.description,
      stripeInvoiceId:
        typeof session.invoice === "string" ? session.invoice : null,
      stripe,
    });
    await logActivity({
      userId: payment.userId,
      entityType: "payment",
      entityId: payment.id,
      action: "paid",
      metadata: { kind: "SETUP", amount: payment.amount },
    });
    return;
  }

  if (kind === "SUBSCRIPTION" && session.subscription) {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    const stripeSub = await stripe.subscriptions.retrieve(subId);
    await upsertSubscriptionFromStripe(stripeSub);
  }
}

async function upsertSubscriptionFromStripe(stripeSub: Stripe.Subscription) {
  const projectId = stripeSub.metadata?.projectId;
  const tier = (stripeSub.metadata?.tier as "LIGHT" | "COMPLETE") || "LIGHT";
  if (!projectId) return;

  const amount = stripeSub.items.data[0]?.price.unit_amount ?? 0;
  const periodEndUnix =
    // selon la version d'API, current_period_end est sur la sub ou l'item
    (stripeSub as unknown as { current_period_end?: number }).current_period_end ??
    stripeSub.items.data[0]?.current_period_end;
  const periodStartUnix =
    (stripeSub as unknown as { current_period_start?: number }).current_period_start ??
    stripeSub.items.data[0]?.current_period_start;

  const status = mapSubStatus(stripeSub.status);

  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  });

  const data = {
    projectId,
    tier,
    status,
    monthlyAmount: amount,
    stripePriceId: stripeSub.items.data[0]?.price.id ?? null,
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    currentPeriodStart: periodStartUnix
      ? new Date(periodStartUnix * 1000)
      : new Date(),
    currentPeriodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000)
      : new Date(Date.now() + 30 * 86400_000),
    canceledAt: status === "CANCELED" ? new Date() : null,
  };

  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data });
  } else {
    await prisma.subscription.create({
      data: { ...data, stripeSubscriptionId: stripeSub.id },
    });
  }
}

async function handleSubscriptionChange(stripeSub: Stripe.Subscription) {
  await upsertSubscriptionFromStripe(stripeSub);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId },
    data: { status: "PAST_DUE" },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return; // les factures hors abonnement (setup) sont gérées au checkout

  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subId },
    include: { project: { select: { id: true, userId: true } } },
  });
  if (!sub) return;

  // Évite les doublons si l'événement est rejoué.
  if (invoice.id) {
    const dup = await prisma.invoice.findUnique({
      where: { stripeInvoiceId: invoice.id },
    });
    if (dup) return;
  }

  await createInternalInvoice({
    userId: sub.project.userId,
    projectId: sub.project.id,
    subscriptionId: sub.id,
    kind: "SUBSCRIPTION",
    amountTtc: invoice.amount_paid,
    description: `Abonnement — ${sub.tier === "LIGHT" ? "Light" : "Complet"}`,
    stripeInvoiceId: invoice.id ?? null,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    pdfUrl: invoice.invoice_pdf ?? null,
    periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
    periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
  });

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "ACTIVE" },
  });
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = (invoice as unknown as {
    subscription?: string | { id: string } | null;
  }).subscription;
  if (!raw) {
    // API récentes : la sub est portée par les lignes de facture
    const line = invoice.lines?.data?.[0] as unknown as {
      subscription?: string | null;
    };
    return line?.subscription ?? null;
  }
  return typeof raw === "string" ? raw : raw.id;
}

function mapSubStatus(
  s: Stripe.Subscription.Status,
): "ACTIVE" | "PAST_DUE" | "CANCELED" | "PAUSED" {
  switch (s) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "PAST_DUE";
    case "paused":
      return "PAUSED";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "ACTIVE";
  }
}

// Crée la facture interne (miroir portail) et notifie le client.
async function createInternalInvoice(args: {
  userId: string;
  projectId: string | null;
  paymentId?: string;
  subscriptionId?: string;
  kind: "SETUP" | "SUBSCRIPTION";
  amountTtc: number;
  description: string | null;
  stripeInvoiceId: string | null;
  hostedInvoiceUrl?: string | null;
  pdfUrl?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  stripe?: Stripe;
}) {
  let hostedInvoiceUrl = args.hostedInvoiceUrl ?? null;
  let pdfUrl = args.pdfUrl ?? null;

  // Pour le setup, récupère l'URL de la facture Stripe générée automatiquement.
  if (args.stripe && args.stripeInvoiceId && !hostedInvoiceUrl) {
    try {
      const inv = await args.stripe.invoices.retrieve(args.stripeInvoiceId);
      hostedInvoiceUrl = inv.hosted_invoice_url ?? null;
      pdfUrl = inv.invoice_pdf ?? null;
    } catch {
      /* non bloquant */
    }
  }

  const { amountHt, taxAmount, taxRate } = splitTtc(args.amountTtc);
  const number = await nextInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      number,
      userId: args.userId,
      projectId: args.projectId,
      paymentId: args.paymentId,
      subscriptionId: args.subscriptionId,
      kind: args.kind,
      status: "PAID",
      amountHt,
      taxAmount,
      taxRate,
      amount: args.amountTtc,
      description: args.description,
      stripeInvoiceId: args.stripeInvoiceId,
      hostedInvoiceUrl,
      pdfUrl,
      periodStart: args.periodStart ?? null,
      periodEnd: args.periodEnd ?? null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { email: true, name: true },
  });
  if (user?.email) {
    const tpl = invoiceIssuedTemplate({
      number: invoice.number,
      amountCents: invoice.amount,
      description: invoice.description,
      hostedInvoiceUrl,
    });
    await sendEmail({ to: user.email, ...tpl });
  }

  return invoice;
}
