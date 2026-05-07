import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Calendar,
  Palette,
  Target,
  Sparkles,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import {
  ProspectStatusEditor,
  ProspectNotes,
  ProspectContactEditor,
  ProspectActions,
} from "@/components/admin/prospect-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/admin/activity-timeline";
import { getProspectActivity } from "@/lib/activity";
import { InfoBadge } from "@/components/admin/info-badge";
import {
  getObjectifDetails,
  getFonctionnaliteDetails,
} from "@/lib/questionnaire-options";

export const dynamic = "force-dynamic";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      questionnaire: true,
      quoteRequests: { orderBy: { createdAt: "desc" } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, email: true } } },
      },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!prospect) notFound();

  const activity = await getProspectActivity(prospect.id);

  let objectifs: string[] = [];
  let fonctionnalites: string[] = [];
  if (prospect.questionnaire) {
    try {
      objectifs = JSON.parse(prospect.questionnaire.objectifs);
      fonctionnalites = JSON.parse(prospect.questionnaire.fonctionnalites);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <PageHeader
        title={prospect.companyName}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Prospects", href: "/admin/prospects" },
          { label: prospect.companyName },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/prospects">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche : détails */}
        <div className="space-y-6 lg:col-span-2">
          <ProspectContactEditor
            prospectId={prospect.id}
            initial={{
              companyName: prospect.companyName,
              contactName: prospect.contactName,
              email: prospect.email,
              phone: prospect.phone,
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoLine icon={Calendar} label="Reçu le">
                {formatDateTime(prospect.createdAt)}
              </InfoLine>
              <InfoLine icon={Sparkles} label="Source">
                <Badge variant="neutral">{prospect.source}</Badge>
              </InfoLine>
              {prospect.user && (
                <InfoLine icon={Mail} label="Compte client">
                  <Link
                    href={`/admin/clients/${prospect.user.id}`}
                    className="text-primary hover:underline"
                  >
                    Voir la fiche client
                  </Link>
                </InfoLine>
              )}
            </CardContent>
          </Card>

          {prospect.questionnaire && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Réponses au questionnaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <Section label="Métier" icon={Target}>
                  {prospect.questionnaire.metier ||
                    prospect.questionnaire.metierCustom ||
                    "—"}
                </Section>
                {objectifs.length > 0 && (
                  <Section label="Objectifs" icon={Target}>
                    <div className="flex flex-wrap gap-1.5">
                      {objectifs.map((o) => {
                        const details = getObjectifDetails(o);
                        return (
                          <InfoBadge
                            key={o}
                            variant="default"
                            label={details.label}
                            description={details.description}
                          />
                        );
                      })}
                      {prospect.questionnaire.objectifCustom && (
                        <Badge variant="neutral">
                          {prospect.questionnaire.objectifCustom}
                        </Badge>
                      )}
                    </div>
                  </Section>
                )}
                <Section label="Style visuel" icon={Palette}>
                  <div className="flex items-center gap-2">
                    <span>
                      {prospect.questionnaire.style || "Non renseigné"}
                    </span>
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
                </Section>
                {prospect.questionnaire.inspiration && (
                  <Section label="Inspiration">
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {prospect.questionnaire.inspiration}
                    </p>
                  </Section>
                )}
                {prospect.questionnaire.logoPreview && (
                  <Section label="Logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prospect.questionnaire.logoPreview}
                      alt={prospect.questionnaire.logoName ?? "Logo"}
                      className="max-h-24 rounded-lg border border-border/40 bg-white p-2"
                    />
                  </Section>
                )}
                {fonctionnalites.length > 0 && (
                  <Section label="Fonctionnalités demandées">
                    <div className="flex flex-wrap gap-1.5">
                      {fonctionnalites.map((f) => {
                        const details = getFonctionnaliteDetails(f);
                        return (
                          <InfoBadge
                            key={f}
                            variant="outline"
                            label={details.label}
                            description={details.description}
                          />
                        );
                      })}
                    </div>
                  </Section>
                )}
                <Section label="Liens existants">
                  <div className="flex flex-col gap-1.5">
                    <LinkItem
                      label="Site actuel"
                      value={prospect.questionnaire.siteActuel}
                    />
                    <LinkItem
                      label="Google Business"
                      value={prospect.questionnaire.googleBusiness}
                    />
                    <LinkItem
                      label="Instagram"
                      value={prospect.questionnaire.instagram}
                    />
                    <LinkItem
                      label="Facebook"
                      value={prospect.questionnaire.facebook}
                    />
                    <LinkItem
                      label="LinkedIn"
                      value={prospect.questionnaire.linkedin}
                    />
                  </div>
                </Section>
                {prospect.questionnaire.message && (
                  <Section label="Message libre">
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {prospect.questionnaire.message}
                    </p>
                  </Section>
                )}
              </CardContent>
            </Card>
          )}

          {prospect.quoteRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Demandes de devis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prospect.quoteRequests.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-border/50 bg-muted/30 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {q.planType && <Badge>{q.planType}</Badge>}
                        {q.subscription && q.subscription !== "NONE" && (
                          <Badge variant="neutral">{q.subscription}</Badge>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDateTime(q.createdAt)}
                        </span>
                      </div>
                      {q.details && (
                        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                          {q.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <ActivityTimeline entries={activity} />
        </div>

        {/* Colonne droite : actions + notes */}
        <div className="space-y-6">
          <ProspectStatusEditor
            prospectId={prospect.id}
            initialStatus={prospect.status}
            initialEstimatedValue={prospect.estimatedValue}
          />
          <ProspectActions
            prospectId={prospect.id}
            hasUser={Boolean(prospect.user)}
            status={prospect.status}
          />
          <ProspectNotes
            prospectId={prospect.id}
            initialNotes={prospect.notes.map((n) => ({
              id: n.id,
              content: n.content,
              createdAt: n.createdAt,
              author: n.author,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function Section({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function LinkItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
    >
      <ExternalLink className="h-3 w-3" />
      <span className="font-medium">{label}:</span>{" "}
      <span className="truncate">{value}</span>
    </a>
  );
}
