import Link from "next/link";
import { Globe, Palette, Target, Sparkles, Info, Clock, Tag } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PreviewControl } from "@/components/portal/preview-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

const PREVIEW_STATUS_LABELS: Record<string, string> = {
  NONE: "Non configuré",
  PROVISIONING: "En déploiement",
  STARTING: "Démarrage",
  BUILDING: "Construction",
  RUNNING: "En ligne",
  STOPPED: "En veille",
  ERROR: "Erreur",
  REVIEW_SENT: "Envoyé pour validation",
  READY: "Prêt",
};

const PREVIEW_STATUS_DOT: Record<string, string> = {
  NONE: "bg-muted-foreground/40",
  PROVISIONING: "bg-amber-500",
  STARTING: "bg-amber-500 animate-pulse",
  BUILDING: "bg-amber-500 animate-pulse",
  RUNNING: "bg-emerald-500",
  STOPPED: "bg-muted-foreground/60",
  ERROR: "bg-rose-500",
  REVIEW_SENT: "bg-emerald-500",
  READY: "bg-sky-500",
};

export default async function PortalProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getSession();
  const userId = session!.user.id;
  const { projectId } = await searchParams;

  const [projects, prospects] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.prospect.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { questionnaire: true },
    }),
  ]);

  const project =
    projects.find((p) => p.id === projectId) ?? projects[0] ?? null;

  const briefs = prospects
    .filter((p) => p.questionnaire)
    .map((p) => {
      let objectifs: string[] = [];
      let fonctionnalites: string[] = [];
      try {
        objectifs = JSON.parse(p.questionnaire!.objectifs);
      } catch {}
      try {
        fonctionnalites = JSON.parse(p.questionnaire!.fonctionnalites);
      } catch {}
      return { prospect: p, objectifs, fonctionnalites };
    });

  return (
    <div>
      <PageHeader
        title="Mes sites"
        description="Retrouvez ici toutes les informations de vos sites et de vos demandes."
      />

      {projects.length > 0 && (
        <section className="mb-8 space-y-3">
          {projects.length > 1 && (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Mes sites ({projects.length})
            </h2>
          )}
          <div className="space-y-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                {/* Identity header */}
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0 text-primary" />
                      <h3 className="truncate text-base font-semibold text-foreground">
                        {p.name}
                      </h3>
                      <StatusBadge kind="project" value={p.status} />
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      MàJ {formatRelative(p.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="mt-3 grid grid-cols-1 gap-3 px-5 pb-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Formule
                    </span>
                    <div className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 text-xs font-medium text-foreground">
                      <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className={p.planType === "NONE" ? "text-muted-foreground" : undefined}>
                        {p.planType === "NONE" ? "À définir" : p.planType}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Domaine
                    </span>
                    <div className="inline-flex h-7 w-fit max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 text-xs font-medium text-foreground">
                      <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {p.domain ?? (
                          <span className="text-muted-foreground">Non défini</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Aperçu
                    </span>
                    <div className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 text-xs font-medium text-foreground">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${PREVIEW_STATUS_DOT[p.previewStatus] ?? "bg-muted-foreground/40"}`}
                        aria-hidden
                      />
                      {PREVIEW_STATUS_LABELS[p.previewStatus] ?? p.previewStatus}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 bg-muted/30 px-5 py-3">
                  {p.githubRepoName && (
                    <PreviewControl
                      projectId={p.id}
                      initialState={
                        (["NONE", "STOPPED", "STARTING", "BUILDING", "RUNNING", "ERROR"].includes(
                          p.previewStatus
                        )
                          ? p.previewStatus
                          : "NONE") as
                          | "NONE"
                          | "STOPPED"
                          | "STARTING"
                          | "BUILDING"
                          | "RUNNING"
                          | "ERROR"
                      }
                      initialUrl={p.previewUrl}
                      projectStatus={p.status}
                    />
                  )}
                  <Button size="sm" asChild>
                    <Link href={`/portal/customization?projectId=${p.id}`}>
                      <Sparkles className="h-4 w-4" /> Demander une modification
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && (
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

      {briefs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {briefs.length > 1
              ? `Mes demandes (${briefs.length})`
              : "Votre brief initial"}
          </h2>
          <div className="space-y-4">
            {briefs.map(({ prospect, objectifs, fonctionnalites }, idx) => (
              <Card key={prospect.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span>
                      {briefs.length > 1
                        ? `Demande n°${briefs.length - idx}`
                        : "Votre brief"}
                      {prospect.companyName ? ` — ${prospect.companyName}` : ""}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {formatRelative(prospect.createdAt)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 text-sm">
                  <Row
                    icon={Target}
                    label="Métier"
                    value={
                      prospect.questionnaire!.metier ||
                      prospect.questionnaire!.metierCustom ||
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
                      <span>{prospect.questionnaire!.style || "—"}</span>
                      {prospect.questionnaire!.couleur && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-xs">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              background: prospect.questionnaire!.couleur,
                            }}
                          />
                          {prospect.questionnaire!.couleur}
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
                  {prospect.questionnaire!.message && (
                    <div>
                      <Label>Votre message</Label>
                      <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">
                        {prospect.questionnaire!.message}
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
            ))}
          </div>
        </section>
      ) : projects.length === 0 ? (
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
