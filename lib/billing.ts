import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const INVOICE_COUNTER_KEY = "invoice";

/**
 * Numéro de facture séquentiel continu, conforme aux obligations comptables
 * françaises (numérotation chronologique sans rupture). Format : LUM-AAAA-000001.
 */
export async function nextInvoiceNumber(date = new Date()): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { key: INVOICE_COUNTER_KEY },
    create: { key: INVOICE_COUNTER_KEY, value: 1 },
    update: { value: { increment: 1 } },
  });
  const year = date.getFullYear();
  return `LUM-${year}-${String(counter.value).padStart(6, "0")}`;
}

/**
 * Taux de TVA appliqué (points de base, 2000 = 20 %). Par défaut 0 :
 * franchise en base de TVA (art. 293 B du CGI). Surchargé via LUMERO_VAT_RATE_BPS.
 */
export function vatRateBps(): number {
  const raw = process.env.LUMERO_VAT_RATE_BPS;
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Décompose un montant TTC (centimes) en HT + TVA selon le taux configuré. */
export function splitTtc(amountTtc: number): {
  amountHt: number;
  taxAmount: number;
  taxRate: number;
} {
  const taxRate = vatRateBps();
  if (taxRate === 0) {
    return { amountHt: amountTtc, taxAmount: 0, taxRate: 0 };
  }
  const amountHt = Math.round((amountTtc * 10000) / (10000 + taxRate));
  return { amountHt, taxAmount: amountTtc - amountHt, taxRate };
}

/**
 * Récupère (ou crée) le client Stripe associé à un utilisateur, en mémorisant
 * son identifiant. Aucune donnée bancaire n'est stockée côté Lumero.
 */
export async function ensureStripeCustomer(user: {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}
