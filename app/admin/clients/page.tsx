import Link from "next/link";
import { Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ClientsList } from "@/components/admin/clients-list";

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
      projects: {
        select: {
          id: true,
          status: true,
          name: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            select: { id: true, tier: true, monthlyAmount: true, status: true },
            take: 1,
          },
        },
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

      <ClientsList
        clients={clients.map((c) => ({
          id: c.id,
          email: c.email,
          name: c.name,
          phone: c.phone,
          createdAt: c.createdAt,
          projects: c.projects.map((p) => ({
            id: p.id,
            status: p.status,
            name: p.name,
          })),
          subscriptions: c.projects.flatMap((p) => p.subscriptions),
        }))}
        showArchived={showArchived}
      />
    </div>
  );
}
