import Link from "next/link";
import { Globe, Palette, Target, Sparkles, Info, Clock } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectSelector } from "@/components/portal/project-selector";

export const dynamic = "force-dynamic";

export default async function PortalProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getSession();
  const userId = session!.user.id;
  const { projectId } = await searchParams;

  const [projects, prospect] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.prospect.findUnique({
      where: { userId },
      include: { questionnaire: true },
    }),
  ]);

  const project =
    projects.find((p) => p.id === projectId) ?? projects[0] ?? null;

  let objectifs: string[] = [];
  let fonctionnalites: string[] = [];
  if (prospect?.questionnaire) {
    try {
      objectifs = JSON.parse(prospect.questionnaire.objectifs);
      fonctionnalites = JSON.parse(prospect.questionnaire.fonctionnalites);
    } catch {
      // ignore
    }
  }

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));

  return (
    <div>
      <PageHeader
        title="Mes sites"
        description="Retrouvez ici toutes les informations de vos sites et de votre brief."
      />

      {projects.length > 1 && (
        <ProjectSelector
          projects={projectOptions}
          selectedId={project?.id ?? ""}
        />
      )}

      {project ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              {project.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge kind="project" value={project.status} />
                  <Badge variant="neutral">Plan {project.planType}</Badge>
                </div>
                {project.domain && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Domaine :</span>{" "}
                    {project.domain}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Dernière mise à jour : {formatRelative(project.updatedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.previewUrl &&
                  (project.status === "REVIEW" || project.status === "LIVE") && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={project.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Voir mon aperçu
                      </a>
                    </Button>
                  )}
                <Button size="sm" asChild>
                  <Link href={`/portal/customization?projectId=${project.id}`}>
                    <Sparkles className="h-4 w-4" /> Demander une modification
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-6 text-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Projet en cours de création</p>
              <p className="mt-1 text-muted-foreground">
                Notre équipe prépare votre site. Vous recevrez un email quand
                une première version sera prête.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {prospect?.questionnaire ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Votre brief initial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <Row
              icon={Target}
              label="Métier"
              value={
                prospect.questionnaire.metier ||
                prospect.questionnaire.metierCustom ||
                "—"
              }
            />
            {objectifs.length > 0 && (
              <div>
                <Label icon={Target}>Objectifs</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {objectifs.map((o) => (
                    <Badge key={o} variant="default">
                      {o}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label icon={Palette}>Style & identité</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span>{prospect.questionnaire.style || "—"}</span>
                {prospect.questionnaire.couleur && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-xs">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: prospect.questionnaire.couleur }}
                    />
                    {prospect.questionnaire.couleur}
                  </span>
                )}
              </div>
            </div>
            {fonctionnalites.length > 0 && (
              <div>
                <Label>Fonctionnalités</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {fonctionnalites.map((f) => (
                    <Badge key={f} variant="outline">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {prospect.questionnaire.message && (
              <div>
                <Label>Votre message</Label>
                <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">
                  {prospect.questionnaire.message}
                </p>
              </div>
            )}
            <p className="border-t border-border/50 pt-3 text-xs text-muted-foreground">
              Une information à modifier ?{" "}
              <Link
                href={`/portal/customization${project ? `?projectId=${project.id}` : ""}`}
                className="font-medium text-primary hover:underline"
              >
                Envoyez-nous une demande →
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : !project ? (
        <EmptyState
          icon={Globe}
          title="Aucun brief pour l'instant"
          description="Remplissez le questionnaire pour que notre équipe prépare votre site."
          action={
            <Button asChild>
              <Link href="/#questionnaire">Commencer le questionnaire</Link>
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function Label({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </p>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Label icon={icon}>{label}</Label>
      <p className="mt-1">{value}</p>
    </div>
  );
}
