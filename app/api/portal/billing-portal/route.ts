import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isStripeEnabled, getStripe, appBaseUrl } from "@/lib/stripe";

// Ouvre le portail de facturation Stripe : le client y gère son moyen de
// paiement, télécharge ses factures et résilie son abonnement en self-service.
export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: "Le portail de facturation n'est pas disponible." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      {
        error:
          "Aucun historique de paiement pour le moment. Réglez un site ou souscrivez un abonnement pour accéder au portail.",
      },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    locale: "fr",
    return_url: `${appBaseUrl()}/portal/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
