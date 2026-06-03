import Stripe from "stripe";

// Client Stripe initialisé paresseusement. Aucune clé n'est requise tant que le
// paiement n'est pas utilisé : en dev/CI sans clé, l'app fonctionne en mode
// « manuel » (les paiements ne sont simplement pas proposés / sont contournés).
let _stripe: Stripe | null = null;

/**
 * Indique si le paiement Stripe est activé (clé secrète présente).
 * Quand il est désactivé, l'app retombe sur le flux manuel/support — ce qui
 * permet aux tests et au dev local de ne jamais être bloqués par le paiement.
 */
export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Vrai si on utilise une clé de test Stripe (`sk_test_…`). On l'expose pour
 * afficher un bandeau « mode test » dans l'UI et éviter toute confusion.
 */
export function isStripeTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY n'est pas configurée — paiement Stripe indisponible.",
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/** URL publique de l'app, utilisée pour les redirections Checkout. */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}
