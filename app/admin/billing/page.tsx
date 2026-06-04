import Link from "next/link";
import { Receipt, Download, Euro, RefreshCw, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isStripeEnabled, isStripeTestMode } from "@/lib/stripe";
import { formatEUR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  SETUP: "Création du site",
  SUBSCRIPTION: "Abonnement",
  OTHER: "Autre",
};

const PAYMENT_LABEL: Record<string, string> = {
  PAID: "Réglé",
  PENDING: "En attente",
  PROCESSING: "En cours",
  FAILED: "Échec",
  REFUNDED: "Remboursé",
  CANCELED: "Annulé",
};

function clientLabel(user: { name: string | null; email: string }) {
  return user.name || user.email;
}

export default async function AdminBillingPage() {
  const [paidAgg, activeSubs, invoiceCount, invoices, payments] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        select: { monthlyAmount: true },
      }),
      prisma.invoice.count(),
      prisma.invoice.findMany({
        orderBy: { issuedAt: "desc" },
        take: 25,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

  const totalPaid = paidAgg._sum.amount ?? 0;
  const mrr = activeSubs.reduce((s, sub) => s + sub.monthlyAmount, 0);

  return (
    <div>
      <PageHeader
        title="Facturation"
        description="Vue d'ensemble des paiements, abonnements et factures."
      />

      {!isStripeEnabled() && (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/[0.04]">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Le paiement en ligne (Stripe) n'est pas activé sur cet environnement.
            Les montants ci-dessous ne reflètent que les enregistrements
            existants.
          </CardContent>
        </Card>
      )}
      {isStripeEnabled() && isStripeTestMode() && (
        <Card className="mb-6 border-blue-500/40 bg-blue-500/[0.04]">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Stripe est en <strong>mode test</strong> : aucun paiement réel n'est
            encaissé.
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Euro className="h-4 w-4" /> Total encaissé
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatEUR(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <RefreshCw className="h-4 w-4" /> Revenu mensuel récurrent
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatEUR(mrr)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeSubs.length} abonnement{activeSubs.length > 1 ? "s" : ""} actif
              {activeSubs.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4" /> Factures émises
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {invoiceCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" />
              Dernières factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune facture.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium tabular-nums">{inv.number}</span>
                      <Link
                        href={`/admin/clients/${inv.user.id}`}
                        className="ml-2 text-muted-foreground hover:text-primary hover:underline"
                      >
                        {clientLabel(inv.user)}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
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
                          className="text-primary hover:text-primary"
                          title="Télécharger le PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Euro className="h-4 w-4 text-primary" />
              Derniers paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun paiement.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/clients/${p.user.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {clientLabel(p.user)}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {KIND_LABEL[p.kind] ?? p.kind}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          "text-xs " +
                          (p.status === "PAID"
                            ? "text-emerald-600"
                            : p.status === "FAILED" || p.status === "CANCELED"
                              ? "text-red-600"
                              : "text-muted-foreground")
                        }
                      >
                        {PAYMENT_LABEL[p.status] ?? p.status}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatEUR(p.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
