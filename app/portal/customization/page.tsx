import { Sparkles } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CustomizationForm } from "@/components/portal/customization-form";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalCustomizationPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getSession();
  const userId = session!.user.id;
  const { projectId } = await searchParams;

  const [requests, projects] = await Promise.all([
    prisma.customizationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const defaultProjectId =
    projectId && projects.some((p) => p.id === projectId)
      ? projectId
      : projects[0]?.id;

  return (
    <div>
      <PageHeader
        title="Personnalisations"
        description="Demandez une modification, un ajout ou une amélioration pour votre site. On s'occupe du reste."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Nouvelle demande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomizationForm
                projects={projects}
                defaultProjectId={defaultProjectId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Historique ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune demande pour l'instant.
                </p>
              ) : (
                <div className="space-y-2">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border/50 bg-muted/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{r.title}</p>
                        <StatusBadge kind="customization" value={r.status} />
                      </div>
                      {projects.length > 1 && r.project && (
                        <p className="mt-1 text-xs text-primary/70">
                          {r.project.name}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {r.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
