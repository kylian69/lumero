"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Info, Loader2, Moon, Play, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PreviewState =
  | "NONE"
  | "STOPPED"
  | "STARTING"
  | "BUILDING"
  | "RUNNING"
  | "ERROR";

type Quota = {
  limit: number;
  used: number;
  remaining: number;
  windowHours: number;
};

type Props = {
  projectId: string;
  initialState: PreviewState;
  initialUrl: string | null;
};

const labels: Record<
  PreviewState,
  { label: string; variant: "default" | "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  NONE: { label: "Non configurée", variant: "neutral" },
  STOPPED: { label: "En veille", variant: "neutral" },
  STARTING: { label: "Démarrage…", variant: "info" },
  BUILDING: { label: "Construction…", variant: "info" },
  RUNNING: { label: "En ligne", variant: "success" },
  ERROR: { label: "Erreur", variant: "danger" },
};

const transitional = (s: PreviewState) => s === "STARTING" || s === "BUILDING";

export function PreviewControl({ projectId, initialState, initialUrl }: Props) {
  const [state, setState] = useState<PreviewState>(initialState);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/projects/${projectId}/preview/status`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        state: PreviewState;
        url: string | null;
        errorMessage: string | null;
        quota: Quota | null;
      };
      setState(data.state);
      setUrl(data.url);
      if (data.quota) setQuota(data.quota);
      if (data.state === "ERROR" && data.errorMessage) {
        toast.error("La preview n'a pas pu démarrer", {
          description: data.errorMessage,
        });
      }
    } catch {
      /* silent */
    }
  }, [projectId]);

  // Initial quota fetch on mount.
  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  // Poll every 3s while the preview is in a transitional state.
  useEffect(() => {
    if (!transitional(state)) return;
    void fetchStatus();
    const id = setInterval(() => void fetchStatus(), 3000);
    return () => clearInterval(id);
  }, [state, fetchStatus]);

  const confirmStart = useCallback((q: Quota | null): boolean => {
    if (!q) return true;
    if (q.remaining <= 0) return false;
    if (q.remaining === 1) {
      return window.confirm(
        `Attention : ce sera votre dernier démarrage pour les prochaines 24h ` +
          `(${q.limit} démarrages max). Pensez à mettre la preview en veille ` +
          `quand vous aurez fini pour économiser les ressources.`
      );
    }
    return true;
  }, []);

  const act = useCallback(
    async (action: "start" | "stop") => {
      if (action === "start" && !confirmStart(quota)) return;
      setBusy(true);
      try {
        const res = await fetch(
          `/api/portal/projects/${projectId}/preview/${action}`,
          { method: "POST" }
        );
        const data = (await res.json()) as {
          state?: PreviewState;
          error?: string;
          quota?: Quota;
        };
        if (!res.ok) {
          toast.error(data.error ?? "Action impossible");
          if (data.quota) setQuota(data.quota);
          return;
        }
        if (data.state) setState(data.state);
        if (data.quota) setQuota(data.quota);
        toast.success(
          action === "start"
            ? "Démarrage de la preview en cours…"
            : "Preview mise en veille"
        );
      } catch (err) {
        toast.error("Erreur réseau", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setBusy(false);
      }
    },
    [projectId, quota, confirmStart]
  );

  if (state === "NONE") return null;
  const meta = labels[state];
  const canStart = !quota || quota.remaining > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={meta.variant}>
          {transitional(state) && <Loader2 className="h-3 w-3 animate-spin" />}
          {meta.label}
        </Badge>

        {state === "RUNNING" && url && (
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Voir mon aperçu
            </a>
          </Button>
        )}

        {(state === "STOPPED" || state === "ERROR") && (
          <Button
            variant={state === "ERROR" ? "outline" : "default"}
            size="sm"
            onClick={() => act("start")}
            disabled={busy || !canStart}
          >
            <Play className="h-4 w-4" />
            {state === "ERROR" ? "Réessayer" : "Démarrer la preview"}
          </Button>
        )}

        {state === "RUNNING" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => act("stop")}
            disabled={busy}
          >
            <Moon className="h-4 w-4" /> Mettre en veille
          </Button>
        )}

        {transitional(state) && (
          <Button variant="ghost" size="sm" onClick={() => act("stop")} disabled={busy}>
            <Power className="h-4 w-4" /> Annuler
          </Button>
        )}
      </div>

      {quota && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          {quota.remaining > 0 ? (
            <>
              {quota.remaining} démarrage{quota.remaining > 1 ? "s" : ""} restant
              {quota.remaining > 1 ? "s" : ""} sur 24h
            </>
          ) : (
            <>
              Limite quotidienne atteinte. Vous pouvez encore mettre en veille,
              le quota se réinitialise progressivement.
            </>
          )}
        </p>
      )}
    </div>
  );
}
