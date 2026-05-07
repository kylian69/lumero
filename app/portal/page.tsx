import Link from "next/link";
import {
  Sparkles,
  LifeBuoy,
  Globe,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatRelative, formatEUR, formatDate } from "@/lib/format";
import { ProjectSelector } from "@/components/portal/project-selector";

export const dynamic = "force-dynamic";

export default async function PortalHome({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getSession();
  const userId = session!.user.id;
  const { projectId } = await searchParams;

  const [projects, openTickets, recentCustomizations, prospect] =
    await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.findMany({
        where: {
          authorId: userId,
          status: { in: ["OPEN", "WAITING_STAFF", "WAITING_CLIENT"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
      prisma.customizationRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.prospect.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { questionnaire: { select: { id: true } } },
      }),
    ]);

  const project =
    projects.find((p) => p.id === projectId) ?? projects[0] ?? null;

  const activeSub = project
    ? await prisma.subscription.findFirst({
        where: { userId, projectId: project.id, status: "ACTIVE" },
      }) ??
      await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE" },
      })
    : await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE" },
      });

  const firstName = session!.user.name?.split(" ")[0];

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));

  return (
    <div>
      <PageHeader
        title={`Bonjour ${firstName || ""} 👋`.trim()}
        description="Suivez vos projets, envoyez des demandes et contactez votre équipe Lumero en un clin d'œil."
      />

      {projects.length > 1 && (
        <ProjectSelector
          projects={projectOptions}
          selectedId={project?.id ?? ""}
        />
      )}

      {/* Bloc bienvenue pour prospect sans projet */}
      {!project && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Votre maquette est en préparation</p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Notre équipe a bien reçu vos réponses et prépare une première
                version. Vous recevrez un email dès qu'elle sera prête.
              </p>
            </div>
            {prospect?.questionnaire && (
              <Button asChild variant="outline">
                <Link href="/portal/project">
                  Voir mon brief <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              {projects.length > 1 ? "Projet sélectionné" : "Mes sites"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold">{project.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <StatusBadge kind="project" value={project.status} />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                      Plan {project.planType}
                    </span>
                    {project.domain && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Globe className="h-3 w-3" />
                        {project.domain}
                      </span>
                    )}
                  </div>
                  {(project.status === "BRIEF" || project.status === "DESIGN") && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Votre site est en cours de conception. Vous serez notifié dès qu'un aperçu sera disponible.
                    </p>
                  )}
                  {project.status === "DEVELOPMENT" && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Votre site est en cours de développement. Un aperçu sera bientôt disponible.
                    </p>
                  )}
                  {project.status === "REVIEW" && project.previewUrl && (
                    <p className="mt-2 text-sm font-medium text-primary">
                      Votre aperçu est prêt ! Consultez-le et faites-nous part de vos retours.
                    </p>
                  )}
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
                    <Link href={`/portal/project${project ? `?projectId=${project.id}` : ""}`}>
                      Gérer mon site
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Votre site sera accessible ici dès que l'équipe aura créé votre
                projet.{" "}
                {prospect?.questionnaire && (
                  <Link
                    href="/portal/project"
                    className="font-medium text-primary hover:underline"
                  >
                    Revoir mes choix →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSub ? (
              <div>
                <p className="text-sm font-semibold">
                  {activeSub.tier === "LIGHT" ? "Light" : "Complet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatEUR(activeSub.monthlyAmount)}/mois · prochain prélèvement
                  le {formatDate(activeSub.currentPeriodEnd)}
                </p>
                <Button asChild size="sm" className="mt-4 w-full" variant="outline">
                  <Link href="/portal/subscription">Gérer l'abonnement</Link>
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas d'abonnement actif.
                </p>
                <Button asChild size="sm" className="mt-4 w-full">
                  <Link href="/portal/subscription">Voir les options</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {projects.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              Tous mes projets ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/portal/project?projectId=${p.id}`}
                  className={`flex flex-col gap-1.5 rounded-xl border p-3 transition-colors hover:bg-muted/60 ${
                    p.id === project?.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 bg-muted/30"
                  }`}
                >
                  <p className="text-sm font-medium">{p.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge kind="project" value={p.status} />
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {p.planType}
                    </span>
                  </div>
                  {p.domain && (
                    <p className="text-xs text-muted-foreground">{p.domain}</p>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Mes personnalisations
            </CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/customization">Tout voir</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCustomizations.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Envie d'ajouter ou de modifier un élément sur votre site ?{" "}
                <Link
                  href="/portal/customization"
                  className="font-medium text-primary hover:underline"
                >
                  Faire une demande →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCustomizations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(r.createdAt)}
                      </p>
                    </div>
                    <StatusBadge kind="customization" value={r.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="h-4 w-4 text-primary" />
              Mes tickets support
            </CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/support">Tout voir</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {openTickets.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Pas de ticket en cours.
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/portal/support/new">
                    <MessageCircle className="h-4 w-4" /> Contacter l'équipe
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {openTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/portal/support/${t.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.subject}
                      </p>
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelative(t.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge kind="ticket" value={t.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
