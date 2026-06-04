import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Sparkles, LifeBuoy, Receipt, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatDateTime, formatEUR } from "@/lib/format";
import { ActivityTimeline } from "@/components/admin/activity-timeline";
import { getClientActivity } from "@/lib/activity";
import { ClientContactEditor, ClientNotes, ClientActions } from "@/components/admin/client-detail";
import { ProjectManager } from "@/components/admin/project-manager";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          planType: true,
          domain: true,
          previewUrl: true,
          previewStatus: true,
          githubRepoUrl: true,
          previewPublishedAt: true,
          updatedAt: true,
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      tickets: {
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
      customizations: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      prospects: { orderBy: { createdAt: "desc" }, take: 1 },
      clientNotes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, email: true } } },
      },
      invoices: { orderBy: { issuedAt: "desc" }, take: 12 },
      payments: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!client) notFound();

  const activity = await getClientActivity(client.id);

  const totalPaid = client.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const PAYMENT_LABEL: Record<string, string> = {
    PAID: "Réglé",
    PENDING: "En attente",
    PROCESSING: "En cours",
    FAILED: "Échec",
    REFUNDED: "Remboursé",
    CANCELED: "Annulé",
  };
  const KIND_LABEL: Record<string, string> = {
    SETUP: "Création du site",
    SUBSCRIPTION: "Abonnement",
    OTHER: "Autre",
  };

  return (
    <div>
      <PageHeader
        title={client.name || client.email}
        description={client.email}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Clients", href: "/admin/clients" },
          { label: client.name || client.email },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProjectManager
            clientId={client.id}
            projects={client.projects.map((p) => ({
              ...p,
              subscription: p.subscriptions[0] ?? null,
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Facturation
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  Total encaissé&nbsp;:{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatEUR(totalPaid)}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Factures
                </p>
                {client.invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune facture émise.
                  </p>
                ) : (
                  <div className="divide-y divide-border/50">
                    {client.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"
                      >
                        <div>
                          <span className="font-medium tabular-nums">
                            {inv.number}
                          </span>
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
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
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
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Paiements
                </p>
                {client.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun paiement enregistré.
                  </p>
                ) : (
                  <div className="divide-y divide-border/50">
                    {client.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"
                      >
                        <div>
                          <span className="font-medium">
                            {KIND_LABEL[p.kind] ?? p.kind}
                          </span>
                          <span
                            className={
                              "ml-2 text-xs " +
                              (p.status === "PAID"
                                ? "text-emerald-600"
                                : p.status === "FAILED" || p.status === "CANCELED"
                                  ? "text-red-600"
                                  : "text-muted-foreground")
                            }
                          >
                            {PAYMENT_LABEL[p.status] ?? p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {formatDate(p.paidAt ?? p.createdAt)}
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatEUR(p.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Personnalisations récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.customizations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune demande de personnalisation.
                </p>
              ) : (
                <div className="space-y-2">
                  {client.customizations.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/customizations/${c.id}`}
                      className="flex flex-col gap-1 rounded-xl border border-border/50 bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium">{c.title}</p>
                        <StatusBadge kind="customization" value={c.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(c.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-4 w-4 text-primary" />
                Tickets support
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun ticket pour ce client.
                </p>
              ) : (
                <div className="space-y-2">
                  {client.tickets.map((t) => (
                    <Link
                      key={t.id}
                      href={`/admin/support/${t.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {t.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(t.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge kind="ticket" value={t.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityTimeline entries={activity} />
        </div>

        <div className="space-y-6">
          <ClientContactEditor
            clientId={client.id}
            initial={{
              name: client.name,
              email: client.email,
              phone: client.phone,
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Client depuis le {formatDate(client.createdAt)}
              </div>
              {client.prospects[0] && (
                <Link
                  href={`/admin/prospects/${client.prospects[0].id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Voir la fiche prospect →
                </Link>
              )}
            </CardContent>
          </Card>

          <ClientNotes
            clientId={client.id}
            initialNotes={client.clientNotes.map((n) => ({
              id: n.id,
              content: n.content,
              createdAt: n.createdAt,
              updatedAt: n.updatedAt,
              author: n.author,
            }))}
          />

          <ClientActions clientId={client.id} isArchived={!!client.archivedAt} />
        </div>
      </div>
    </div>
  );
}
