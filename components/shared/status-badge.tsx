import { Badge, type BadgeProps } from "@/components/ui/badge";

const PROSPECT: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  NEW: { label: "Nouveau", variant: "info" },
  CONTACTED: { label: "Contacté", variant: "default" },
  QUALIFIED: { label: "Qualifié", variant: "default" },
  PROPOSAL_SENT: { label: "Devis envoyé", variant: "warning" },
  NEGOTIATING: { label: "Négociation", variant: "warning" },
  WON: { label: "Gagné", variant: "success" },
  LOST: { label: "Perdu", variant: "danger" },
  ARCHIVED: { label: "Archivé", variant: "neutral" },
};

const TICKET: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  OPEN: { label: "Ouvert", variant: "info" },
  WAITING_CLIENT: { label: "En attente client", variant: "warning" },
  WAITING_STAFF: { label: "À traiter", variant: "warning" },
  RESOLVED: { label: "Résolu", variant: "success" },
  CLOSED: { label: "Fermé", variant: "neutral" },
};

const PRIORITY: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  LOW: { label: "Faible", variant: "neutral" },
  NORMAL: { label: "Normale", variant: "default" },
  HIGH: { label: "Haute", variant: "warning" },
  URGENT: { label: "Urgent", variant: "danger" },
};

const CUSTOM: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  SUBMITTED: { label: "Soumise", variant: "info" },
  IN_REVIEW: { label: "En revue", variant: "warning" },
  IN_PROGRESS: { label: "En cours", variant: "warning" },
  COMPLETED: { label: "Terminée", variant: "success" },
  REJECTED: { label: "Refusée", variant: "danger" },
};

const SUBSCRIPTION: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  ACTIVE: { label: "Actif", variant: "success" },
  PAST_DUE: { label: "En retard", variant: "danger" },
  CANCELED: { label: "Annulé", variant: "neutral" },
  PAUSED: { label: "En pause", variant: "warning" },
};

const PROJECT: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  BRIEF: { label: "Brief", variant: "info" },
  DESIGN: { label: "Design", variant: "default" },
  DEVELOPMENT: { label: "Développement", variant: "default" },
  REVIEW: { label: "Revue", variant: "warning" },
  LIVE: { label: "En ligne", variant: "success" },
  PAUSED: { label: "En pause", variant: "warning" },
  ARCHIVED: { label: "Archivé", variant: "neutral" },
};

const PREVIEW_STATUS: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  NONE: { label: "Non configuré", variant: "neutral" },
  PROVISIONING: { label: "En déploiement", variant: "warning" },
  READY: { label: "Aperçu prêt", variant: "info" },
  REVIEW_SENT: { label: "Envoyé au client", variant: "success" },
};

type Kind = "prospect" | "ticket" | "priority" | "customization" | "subscription" | "project" | "previewStatus";

const MAPS: Record<Kind, Record<string, { label: string; variant: BadgeProps["variant"] }>> = {
  prospect: PROSPECT,
  ticket: TICKET,
  priority: PRIORITY,
  customization: CUSTOM,
  subscription: SUBSCRIPTION,
  project: PROJECT,
  previewStatus: PREVIEW_STATUS,
};

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: Kind;
  value: string;
  className?: string;
}) {
  const entry = MAPS[kind][value] ?? { label: value, variant: "neutral" as const };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}
