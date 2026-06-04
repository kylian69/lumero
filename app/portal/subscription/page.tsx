import Link from "next/link";
import { CreditCard, Calendar, Check, MessageCircle, ArrowUpRight } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { CancelSubscription } from "@/components/portal/cancel-subscription";
import { CheckoutButton } from "@/components/portal/checkout-button";
import { isStripeEnabled } from "@/lib/stripe";
import { monthlyAmountCents } from "@/lib/pricing";
import { formatEUR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const PLAN_FEATURES: Record<"LIGHT" | "COMPLETE", string[]> = {
  LIGHT: [
    "Hébergement & certificat SSL",
    "2 modifications par mois",
    "Surveillance uptime 24/7",
    "Support par email",
  ],
  COMPLETE: [
    "Modifications illimitées",
    "Optimisation SEO en continu",
    "Support prioritaire (24h)",
    "Rapport mensuel d'activité",
  ],
};

export default async function PortalSubscriptionPage() {
  const session = await getSession();
  const userId = session!.user.id;
  const stripeOn = isStripeEnabled();

  const [subscriptions, project] = await Promise.all([
    prisma.subscription.findMany({
      where: { project: { userId } },
      orderBy: { createdAt: "desc" },
    }),
    // Projet de référence pour le paiement de l'abonnement (le plus récent).
    prisma.project.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, planType: true },
    }),
  ]);

  const active = subscriptions.find((s) => s.status === "ACTIVE");
  const planType = project?.planType ?? "STANDARD";

  const plans = (["LIGHT", "COMPLETE"] as const).map((tier) => ({
    tier,
    name: tier === "LIGHT" ? "Light" : "Complet",
    price: monthlyAmountCents(planType, tier),
    featured: tier === "COMPLETE",
    features: PLAN_FEATURES[tier],
  }));

  return (
    <div>
      <PageHeader
        title="Abonnement"
        description="Retrouvez ici les détails de votre abonnement mensuel."
      />

      {active ? (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Abonnement actif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  Formule {active.tier === "LIGHT" ? "Light" : "Complet"}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <StatusBadge kind="subscription" value={active.status} />
                  <span>{formatEUR(active.monthlyAmount)} / mois</span>
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {active.cancelAtPeriodEnd
                    ? `Se termine le ${formatDate(active.currentPeriodEnd)}`
                    : `Prochain prélèvement le ${formatDate(active.currentPeriodEnd)}`}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {stripeOn && active.stripeSubscriptionId ? (
                  <CheckoutButton
                    endpoint="/api/portal/billing-portal"
                    payload={{}}
                    variant="outline"
                  >
                    <CreditCard className="h-4 w-4" />
                    Gérer
                  </CheckoutButton>
                ) : (
                  <Button variant="outline" asChild>
                    <Link href="/portal/support/new?topic=FACTURATION">
                      <MessageCircle className="h-4 w-4" />
                      Modifier
                    </Link>
                  </Button>
                )}
                <CancelSubscription subscriptionId={active.id} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas d'abonnement actif pour le moment. Choisissez une
              formule ci-dessous.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const isActive = active?.tier === plan.tier;
          const canCheckout = stripeOn && !active && !!project;
          return (
            <Card
              key={plan.tier}
              className={plan.featured ? "border-primary/40 bg-primary/[0.03]" : undefined}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Formule {plan.name}</span>
                  {plan.featured && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      Recommandée
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {formatEUR(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground"> / mois</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isActive ? (
                    <Button variant="outline" className="w-full" disabled>
                      Formule actuelle
                    </Button>
                  ) : canCheckout ? (
                    <CheckoutButton
                      endpoint="/api/portal/checkout/subscription"
                      payload={{ projectId: project!.id, tier: plan.tier }}
                      className="w-full"
                      variant={plan.featured ? "default" : "outline"}
                    >
                      <CreditCard className="h-4 w-4" />
                      Souscrire — {formatEUR(plan.price)}/mois
                    </CheckoutButton>
                  ) : (
                    <Button
                      asChild
                      variant={plan.featured ? "default" : "outline"}
                      className="w-full"
                    >
                      <Link
                        href={`/portal/support/new?topic=FACTURATION&subject=${encodeURIComponent(
                          `Passage à la formule ${plan.name}`,
                        )}`}
                      >
                        Choisir cette formule
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/#tarifs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowUpRight className="h-4 w-4" />
          Comparer les formules sur notre site
        </Link>
      </div>

      {subscriptions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/50">
              {subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {s.tier === "LIGHT" ? "Light" : "Complet"}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {formatEUR(s.monthlyAmount)} / mois
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge kind="subscription" value={s.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
