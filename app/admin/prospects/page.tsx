import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProspectsList } from "@/components/admin/prospects-list";
import type { ProspectStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES: ProspectStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "WON",
  "LOST",
];

const LABELS: Record<ProspectStatus, string> = {
  NEW: "Nouveaux",
  CONTACTED: "Contactés",
  QUALIFIED: "Qualifiés",
  PROPOSAL_SENT: "Devis envoyé",
  NEGOTIATING: "Négociation",
  WON: "Gagnés",
  LOST: "Perdus",
  ARCHIVED: "Archivés",
};

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const filterStatus = STATUSES.includes(status as ProspectStatus)
    ? (status as ProspectStatus)
    : undefined;

  const prospects = await prisma.prospect.findMany({
    where: {
      AND: [
        filterStatus ? { status: filterStatus } : {},
        q
          ? {
              OR: [
                { companyName: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { questionnaire: true, quoteRequests: true },
  });

  const counts = await prisma.prospect.groupBy({
    by: ["status"],
    _count: true,
  });
  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count] as const),
  );

  return (
    <div>
      <PageHeader
        title="Prospects"
        description="Gérez tous les prospects entrants depuis le questionnaire, les demandes de devis ou les contacts directs."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill label="Tous" href="/admin/prospects" active={!filterStatus} />
        {STATUSES.map((s) => (
          <FilterPill
            key={s}
            label={LABELS[s]}
            count={countMap[s]}
            href={`/admin/prospects?status=${s}`}
            active={filterStatus === s}
          />
        ))}
      </div>

      <form className="mb-6" action="/admin/prospects">
        {filterStatus && (
          <input type="hidden" name="status" value={filterStatus} />
        )}
        <input
          type="search"
          name="q"
          placeholder="Rechercher par nom, email, téléphone…"
          defaultValue={q ?? ""}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </form>

      <ProspectsList prospects={prospects} />
    </div>
  );
}

function FilterPill({
  label,
  count,
  href,
  active,
}: {
  label: string;
  count?: number;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {count ? (
        <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px]">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
