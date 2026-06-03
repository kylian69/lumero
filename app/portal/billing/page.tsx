import Link from "next/link";
import { FileText, Download, CreditCard } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/portal/checkout-button";
import { isStripeEnabled } from "@/lib/stripe";
import { setupFeeCents, PLAN_LABELS } from "@/lib/pricing";
import { formatEUR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  SETUP: "Création du site",
  SUBSCRIPTION: "Abonnement",
  OTHER: "Autre",
};

export default async function PortalBillingPage() {
  const session = await getSession();
  const userId = session!.user.id;
  const stripeOn = isStripeEnabled();

  const [invoices, unpaidProjects] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { userId, setupPaidAt: null, planType: { not: "NONE" } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Facturation"
        description="Réglez vos sites et retrouvez l'ensemble de vos factures."
      />

      {/* Sites à régler */}
      {unpaidProjects.length > 0 && (
        <div className="mb-6 space-y-3">
          {unpaidProjects.map((p) => {
            const amount = setupFeeCents(p.planType);
            return (
              <Card key={p.id} className="border-primary/30">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Création du site — formule {PLAN_LABELS[p.planType]} ·{" "}
                      <span className="font-medium text-foreground">
                        {formatEUR(amount)}
                      </span>{" "}
                      (paiement unique)
                    </p>
                  </div>
                  {stripeOn && amount > 0 ? (
                    <CheckoutButton
                      endpoint="/api/portal/checkout/setup"
                      payload={{ projectId: p.id }}
                    >
                      <CreditCard className="h-4 w-4" />
                      Régler {formatEUR(amount)}
                    </CheckoutButton>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link href="/portal/support/new?topic=FACTURATION">
                        Demander une facture
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Historique des factures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Mes factures
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas encore de facture.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium tabular-nums">{inv.number}</span>
                    <span className="ml-2 text-muted-foreground">
                      {KIND_LABEL[inv.kind] ?? inv.kind}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {formatDate(inv.issuedAt)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatEUR(inv.amount)}
                    </span>
                    {inv.pdfUrl || inv.hostedInvoiceUrl ? (
                      <a
                        href={(inv.pdfUrl || inv.hostedInvoiceUrl)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Les paiements sont traités de façon sécurisée par Stripe. Lumero ne
        conserve aucune donnée de carte bancaire.
      </p>
    </div>
  );
}
