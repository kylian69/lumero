import { requireRole } from "@/lib/session";
import { LogsExplorer } from "@/components/admin/logs-explorer";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireRole("ADMIN");
  const { category } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Journaux</h1>
        <p className="text-sm text-muted-foreground">
          Toutes les actions essentielles, centralisées et consultables :
          authentification, facturation, CRM, projets, support…
        </p>
      </div>
      <LogsExplorer initialCategory={category ?? ""} />
    </div>
  );
}
