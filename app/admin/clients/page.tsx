import Link from "next/link";
import { Users, Mail, Phone, Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatEUR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string }>;
}) {
  const { q, archived } = await searchParams;
  const showArchived = archived === "1";
  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      archivedAt: showArchived ? { not: null } : null,
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { name: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      projects: { select: { id: true, status: true, name: true } },
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { id: true, tier: true, monthlyAmount: true, status: true },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Tous les utilisateurs avec un compte client — prospects convertis, abonnés, acheteurs."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1" action="/admin/clients">
          {showArchived && <input type="hidden" name="archived" value="1" />}
          <input
            type="search"
            name="q"
            placeholder="Rechercher par email, nom…"
            defaultValue={q ?? ""}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/admin/clients"
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${!showArchived ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:bg-muted/40"}`}
          >
            Actifs
          </Link>
          <Link
            href="/admin/clients?archived=1"
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${showArchived ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:bg-muted/40"}`}
          >
            <Archive className="h-4 w-4" />
            Archivés
          </Link>
        </div>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          description="Les clients apparaîtront ici dès qu'ils auront un compte."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {clients.map((c) => {
                const activeSub = c.subscriptions[0];
                return (
                  <Link
                    key={c.id}
                    href={`/admin/clients/${c.id}`}
                    className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(c.name || c.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {c.name || "—"}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </span>
                          {c.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                          <span>depuis {formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {c.projects.length > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          {c.projects.length} projet{c.projects.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {activeSub ? (
                        <>
                          <StatusBadge
                            kind="subscription"
                            value={activeSub.status}
                          />
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            {activeSub.tier} · {formatEUR(activeSub.monthlyAmount)}/mois
                          </span>
                        </>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          Sans abonnement
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
