export type PlanType = "NONE" | "START" | "STANDARD" | "PRO";
export type SubscriptionTier = "NONE" | "LIGHT" | "COMPLETE";

// Prix mensuels en centimes, par formule (planType) et par palier d'abonnement.
// Source de vérité unique, alignée sur la grille publique (components/sections/pricing.tsx).
const MONTHLY_PRICE_CENTS: Record<PlanType, Record<SubscriptionTier, number>> = {
  NONE: { NONE: 0, LIGHT: 900, COMPLETE: 1900 },
  START: { NONE: 0, LIGHT: 900, COMPLETE: 1900 },
  STANDARD: { NONE: 0, LIGHT: 1400, COMPLETE: 2900 },
  PRO: { NONE: 0, LIGHT: 1900, COMPLETE: 4900 },
};

// Montant mensuel (centimes) attendu pour une formule et un palier donnés.
export function monthlyAmountCents(
  planType: PlanType,
  tier: SubscriptionTier,
): number {
  return MONTHLY_PRICE_CENTS[planType]?.[tier] ?? 0;
}

export function monthlyPricesForPlan(
  planType: PlanType,
): Record<SubscriptionTier, number> {
  return MONTHLY_PRICE_CENTS[planType] ?? MONTHLY_PRICE_CENTS.NONE;
}
