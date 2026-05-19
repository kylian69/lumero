"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Globe,
  Github,
  ExternalLink,
  Send,
  Settings2,
  RefreshCw,
  Trash2,
  Clock,
  Pencil,
  Check,
  X,
  Play,
  Moon,
  RotateCcw,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  ProjectSubscription,
  type ProjectSubscription as ProjectSubscriptionData,
} from "@/components/admin/project-subscription";

type Project = {
  id: string;
  name: string;
  slug: string;
  status: string;
  planType: string;
  domain: string | null;
  previewUrl: string | null;
  previewStatus: string;
  githubRepoUrl: string | null;
  previewPublishedAt: Date | null;
  updatedAt: Date;
  subscription: ProjectSubscriptionData | null;
};

const PREVIEW_STATUS_LABELS: Record<string, string> = {
  NONE: "Non configuré",
  PROVISIONING: "En déploiement",
  STARTING: "Démarrage",
  BUILDING: "Construction",
  RUNNING: "En ligne",
  STOPPED: "En veille",
  ERROR: "Erreur",
  REVIEW_SENT: "Envoyé au client",
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

function previewStatusLabel(value: string): string {
  return PREVIEW_STATUS_LABELS[value] ?? value;
}

function previewStatusDotClass(value: string): string {
  return PREVIEW_STATUS_DOT[value] ?? "bg-muted-foreground/40";
}

type ProjectManagerProps = {
  clientId: string;
  projects: Project[];
};

export function ProjectManager({ clientId, projects: initial }: ProjectManagerProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState(initial);
  const [showForm, setShowForm] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newPlan, setNewPlan] = React.useState<"NONE" | "START" | "STANDARD" | "PRO">("NONE");
  const [creating, setCreating] = React.useState(false);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleteGithub, setDeleteGithub] = React.useState(false);
  const [deleteDocker, setDeleteDocker] = React.useState(false);
  const [editingDomainId, setEditingDomainId] = React.useState<string | null>(null);
  const [domainInput, setDomainInput] = React.useState("");
  const [editingPlanId, setEditingPlanId] = React.useState<string | null>(null);

  function setMsg(projectId: string, msg: string) {
    setMessages((prev) => ({ ...prev, [projectId]: msg }));
    setTimeout(() => setMessages((prev) => ({ ...prev, [projectId]: "" })), 4000);
  }

  function startEditDomain(p: Project) {
    setEditingDomainId(p.id);
    setDomainInput(p.domain ?? "");
  }

  async function saveDomain(projectId: string) {
    const value = domainInput.trim() || null;
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: value }),
      });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, domain: value } : p))
        );
        setEditingDomainId(null);
      } else {
        setMsg(projectId, data.error ?? "Erreur lors de la mise à jour du domaine");
      }
    } catch {
      setMsg(projectId, "Erreur réseau");
    }
  }

  async function savePlan(
    projectId: string,
    value: "NONE" | "START" | "STANDARD" | "PRO"
  ) {
    setEditingPlanId(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: value }),
      });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, planType: value } : p))
        );
        router.refresh();
      } else {
        setMsg(projectId, data.error ?? "Erreur lors de la mise à jour de la formule");
      }
    } catch {
      setMsg(projectId, "Erreur réseau");
    }
  }

  async function createProject() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clientId, name: newName.trim(), planType: newPlan }),
      });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) => [...prev, { ...data.project, subscription: null }]);
        setNewName("");
        setShowForm(false);
        router.refresh();
      } else {
        alert(data.error ?? "Erreur lors de la création");
      }
    } finally {
      setCreating(false);
    }
  }

  async function provision(projectId: string) {
    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/provision`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, previewStatus: "PROVISIONING", githubRepoUrl: data.githubRepoUrl }
              : p
          )
        );
        setMsg(projectId, "Repo GitHub créé et preview enregistrée. Le client peut maintenant la démarrer depuis son portail.");
        router.refresh();
      } else {
        setMsg(projectId, data.error ?? "Erreur lors du provisionnement");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function syncPreview(projectId: string) {
    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, previewStatus: data.project.previewStatus, previewUrl: data.project.previewUrl }
              : p
          )
        );
        setMsg(projectId, "Aperçu synchronisé.");
        router.refresh();
      } else {
        setMsg(projectId, data.error ?? data.message ?? "Erreur lors de la synchronisation");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteProject(projectId: string) {
    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteGithub, deleteDocker }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setConfirmDeleteId(null);
        setDeleteGithub(false);
        setDeleteDocker(false);
        if (Array.isArray(data?.warnings) && data.warnings.length > 0) {
          setMsg(projectId, `Supprimé avec avertissements : ${data.warnings.join(" ; ")}`);
        }
        router.refresh();
      } else {
        const data = await res.json();
        setMsg(projectId, data.error ?? "Erreur lors de la suppression");
        setConfirmDeleteId(null);
      }
    } finally {
      setLoadingId(null);
    }
  }

  function openDeleteConfirm(projectId: string) {
    setConfirmDeleteId(projectId);
    setDeleteGithub(false);
    setDeleteDocker(false);
  }

  async function previewAction(
    projectId: string,
    action: "start" | "stop" | "redeploy"
  ) {
    setLoadingId(projectId);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/preview/${action}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok && data.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, previewStatus: data.project.previewStatus }
              : p
          )
        );
        const labels = {
          start: "Démarrage de la preview lancé.",
          stop: "Preview mise en veille.",
          redeploy: "Redéploiement lancé.",
        } as const;
        setMsg(projectId, labels[action]);
        router.refresh();
      } else {
        setMsg(projectId, data.error ?? "Erreur");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function publishPreview(projectId: string) {
    setLoadingId(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/publish-preview`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, status: "REVIEW", previewPublishedAt: new Date() }
              : p
          )
        );
        setMsg(projectId, "Preview publiée au client.");
        router.refresh();
      } else {
        setMsg(projectId, data.error ?? "Erreur lors de la publication");
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Projets & sites</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
            <p className="text-sm font-medium">Créer un projet</p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Nom du site
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Site Dupont Plomberie"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Formule
              </label>
              <select
                value={newPlan}
                onChange={(e) =>
                  setNewPlan(e.target.value as "NONE" | "START" | "STANDARD" | "PRO")
                }
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="NONE">Aucune (à définir plus tard)</option>
                <option value="START">Start</option>
                <option value="STANDARD">Standard</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createProject} disabled={creating || !newName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {projects.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">Aucun projet associé à ce compte.</p>
        )}

        {projects.map((p) => {
          const loading = loadingId === p.id;
          return (
            <div
              key={p.id}
              className="overflow-hidden rounded-xl border border-border/50 bg-muted/30"
            >
              {/* Identity header: name + project status + delete */}
              <div className="flex items-start justify-between gap-3 px-4 pt-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {p.name}
                    </h3>
                    <StatusBadge kind="project" value={p.status} />
                    {p.previewPublishedAt && (
                      <Badge variant="success" className="text-xs">
                        Envoyé au client
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    MàJ {formatRelative(p.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={() => openDeleteConfirm(p.id)}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Supprimer ce projet"
                  aria-label={`Supprimer le projet ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Metadata row: plan · domain · aperçu · github */}
              <div className="mt-3 grid grid-cols-1 gap-3 px-4 pb-3 sm:grid-cols-3">
                {/* Formule */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Formule
                  </span>
                  {editingPlanId === p.id ? (
                    <select
                      autoFocus
                      defaultValue={p.planType}
                      onChange={(e) =>
                        savePlan(
                          p.id,
                          e.target.value as "NONE" | "START" | "STANDARD" | "PRO"
                        )
                      }
                      onBlur={() => setEditingPlanId(null)}
                      className="h-7 rounded-full border border-input bg-background px-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="NONE">Aucune</option>
                      <option value="START">Start</option>
                      <option value="STANDARD">Standard</option>
                      <option value="PRO">Pro</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingPlanId(p.id)}
                      className="group inline-flex h-7 w-fit items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      title="Modifier la formule"
                    >
                      <Tag className="h-3 w-3" />
                      {p.planType === "NONE" ? (
                        <span className="text-muted-foreground">Aucune</span>
                      ) : (
                        p.planType
                      )}
                      <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                    </button>
                  )}
                </div>

                {/* Domaine */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Domaine
                  </span>
                  {editingDomainId === p.id ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveDomain(p.id);
                          if (e.key === "Escape") setEditingDomainId(null);
                        }}
                        placeholder="exemple.fr"
                        autoFocus
                        className="h-7 w-40 rounded-full border border-input bg-background px-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                      />
                      <button
                        onClick={() => saveDomain(p.id)}
                        className="rounded-full p-1 text-primary hover:bg-primary/10"
                        title="Enregistrer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingDomainId(null)}
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                        title="Annuler"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditDomain(p)}
                      className="group inline-flex h-7 w-fit max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      title={p.domain ? "Modifier le domaine" : "Ajouter un domaine"}
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {p.domain ?? (
                          <span className="text-muted-foreground">Ajouter</span>
                        )}
                      </span>
                      <Pencil className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                    </button>
                  )}
                </div>

                {/* Aperçu */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Aperçu
                  </span>
                  <div
                    className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 text-xs font-medium text-foreground"
                    title={previewStatusLabel(p.previewStatus)}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${previewStatusDotClass(p.previewStatus)}`}
                      aria-hidden
                    />
                    {previewStatusLabel(p.previewStatus)}
                  </div>
                </div>
              </div>

              {p.githubRepoUrl && (
                <div className="px-4 pb-3">
                  <a
                    href={p.githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Github className="h-3 w-3" />
                    Repo GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border/40 bg-background/40 px-4 py-3">
                {/* NONE: no preview yet, only the provisioning button */}
                {p.previewStatus === "NONE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => provision(p.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Settings2 className="h-4 w-4" />
                        Configurer la preview
                      </>
                    )}
                  </Button>
                )}

                {/* All non-NONE states share these helpers */}
                {p.previewStatus !== "NONE" && (
                  <>
                    {/* "Voir l'aperçu" — only meaningful when actually running */}
                    {p.previewStatus === "RUNNING" && p.previewUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={p.previewUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Voir l'aperçu
                        </a>
                      </Button>
                    )}

                    {/* STOPPED → Démarrer */}
                    {p.previewStatus === "STOPPED" && (
                      <Button
                        size="sm"
                        onClick={() => previewAction(p.id, "start")}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-4 w-4" /> Démarrer
                          </>
                        )}
                      </Button>
                    )}

                    {/* RUNNING → Mettre en veille + Redéployer */}
                    {p.previewStatus === "RUNNING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewAction(p.id, "stop")}
                          disabled={loading}
                        >
                          <Moon className="h-4 w-4" /> Mettre en veille
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewAction(p.id, "redeploy")}
                          disabled={loading}
                        >
                          <RotateCcw className="h-4 w-4" /> Redéployer
                        </Button>
                      </>
                    )}

                    {/* STARTING / BUILDING → spinner + Annuler */}
                    {(p.previewStatus === "STARTING" ||
                      p.previewStatus === "BUILDING") && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {p.previewStatus === "BUILDING"
                            ? "Construction de l'image…"
                            : "Démarrage du conteneur…"}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => previewAction(p.id, "stop")}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" /> Annuler
                        </Button>
                      </>
                    )}

                    {/* ERROR → message + Réessayer */}
                    {p.previewStatus === "ERROR" && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-rose-600">
                          <AlertTriangle className="h-3 w-3" />
                          Échec du démarrage. Synchroniser pour voir le détail.
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewAction(p.id, "start")}
                          disabled={loading}
                        >
                          <RotateCcw className="h-4 w-4" /> Réessayer
                        </Button>
                      </>
                    )}

                    {/* Publier au client — disponible dès que la preview est
                        en ligne. Reste accessible pour re-publier au besoin. */}
                    {p.previewStatus === "RUNNING" && (
                      <Button
                        size="sm"
                        onClick={() => publishPreview(p.id)}
                        disabled={loading}
                      >
                        <Send className="h-4 w-4" />
                        {p.previewPublishedAt ? "Republier au client" : "Publier au client"}
                      </Button>
                    )}

                    {/* Synchroniser — toujours présent pour refresh l'état */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => syncPreview(p.id)}
                      disabled={loading}
                      title="Actualiser l'état depuis l'orchestrateur"
                      className="ml-auto"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>

              <div className="border-t border-border/40 px-4 py-3">
                <ProjectSubscription
                  projectId={p.id}
                  subscription={p.subscription}
                />
              </div>

              {messages[p.id] && (
                <p className="border-t border-border/40 bg-background/40 px-4 py-2 text-xs text-muted-foreground">
                  {messages[p.id]}
                </p>
              )}
            </div>
          );
        })}

        {(() => {
          const projectToDelete = projects.find((p) => p.id === confirmDeleteId) ?? null;
          const isDeleting = loadingId === confirmDeleteId;
          return (
            <Dialog
              open={!!projectToDelete}
              onClose={() => {
                if (!isDeleting) setConfirmDeleteId(null);
              }}
              labelledBy="delete-project-title"
              describedBy="delete-project-desc"
              className="max-w-lg"
            >
              {projectToDelete && (
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="flex-1">
                      <h2
                        id="delete-project-title"
                        className="text-xl font-semibold text-foreground"
                      >
                        Supprimer ce projet ?
                      </h2>
                      <p
                        id="delete-project-desc"
                        className="mt-2 text-sm text-muted-foreground"
                      >
                        Vous êtes sur le point de supprimer définitivement le projet{" "}
                        <span className="font-medium text-foreground">
                          « {projectToDelete.name} »
                        </span>
                        . Cette action est <span className="font-semibold">irréversible</span>.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <label className="flex items-start gap-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={deleteGithub}
                        onChange={(e) => setDeleteGithub(e.target.checked)}
                        disabled={!projectToDelete.githubRepoUrl || isDeleting}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-destructive"
                      />
                      <span>
                        <span className="font-medium">Supprimer aussi le repo GitHub</span>
                        {!projectToDelete.githubRepoUrl && (
                          <span className="block text-xs text-muted-foreground">
                            Aucun repo GitHub associé
                          </span>
                        )}
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={deleteDocker}
                        onChange={(e) => setDeleteDocker(e.target.checked)}
                        disabled={isDeleting}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-destructive"
                      />
                      <span className="font-medium">
                        Supprimer aussi le conteneur Docker de preview
                      </span>
                    </label>
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={isDeleting}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => deleteProject(projectToDelete.id)}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 hover:-translate-y-0.5"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Suppression…
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer définitivement
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Dialog>
          );
        })()}
      </CardContent>
    </Card>
  );
}
