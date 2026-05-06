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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";

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
  vercelProjectId: string | null;
  previewPublishedAt: Date | null;
};

type ProjectManagerProps = {
  clientId: string;
  projects: Project[];
};

export function ProjectManager({ clientId, projects: initial }: ProjectManagerProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState(initial);
  const [showForm, setShowForm] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newPlan, setNewPlan] = React.useState<"START" | "STANDARD" | "PRO">("START");
  const [creating, setCreating] = React.useState(false);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  function setMsg(projectId: string, msg: string) {
    setMessages((prev) => ({ ...prev, [projectId]: msg }));
    setTimeout(() => setMessages((prev) => ({ ...prev, [projectId]: "" })), 4000);
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
        setProjects((prev) => [...prev, data.project]);
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
        setMsg(projectId, "Repo GitHub et projet Vercel créés. En attente du premier déploiement…");
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
        setMsg(projectId, "Aperçu synchronisé depuis Vercel.");
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
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setConfirmDeleteId(null);
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
              ? { ...p, previewStatus: "REVIEW_SENT", status: "REVIEW" }
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
                onChange={(e) => setNewPlan(e.target.value as "START" | "STANDARD" | "PRO")}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
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
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/30 p-4"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge kind="project" value={p.status} />
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-foreground">
                      {p.planType}
                    </span>
                    {p.domain && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {p.domain}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge kind="previewStatus" value={p.previewStatus} />
                  {confirmDeleteId === p.id ? (
                    <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-2 py-1">
                      <span className="text-xs text-destructive">Supprimer ?</span>
                      <button
                        onClick={() => deleteProject(p.id)}
                        disabled={loading}
                        className="rounded px-1.5 py-0.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Oui"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="group rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Supprimer ce projet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Infrastructure links */}
              {(p.githubRepoUrl || p.vercelProjectId) && (
                <div className="flex flex-wrap gap-2">
                  {p.githubRepoUrl && (
                    <a
                      href={p.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      <Github className="h-3 w-3" />
                      Repo GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
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
                        Configurer GitHub & Vercel
                      </>
                    )}
                  </Button>
                )}

                {p.previewStatus === "PROVISIONING" && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      En attente du premier déploiement Vercel…
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncPreview(p.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Synchroniser
                        </>
                      )}
                    </Button>
                  </>
                )}

                {p.previewStatus === "READY" && (
                  <>
                    {p.previewUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={p.previewUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Voir l'aperçu
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncPreview(p.id)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => publishPreview(p.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Publier au client
                        </>
                      )}
                    </Button>
                  </>
                )}

                {p.previewStatus === "REVIEW_SENT" && (
                  <>
                    {p.previewUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={p.previewUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Voir l'aperçu
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncPreview(p.id)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                    <Badge variant="success" className="text-xs">
                      Envoyé au client
                    </Badge>
                  </>
                )}
              </div>

              {messages[p.id] && (
                <p className="text-xs text-muted-foreground">{messages[p.id]}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
