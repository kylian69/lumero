"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Moon, Play, Power } from "lucide-react";
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

type Props = {
  projectId: string;
  initialState: PreviewState;
  initialUrl: string | null;
};

const labels: Record<PreviewState, { label: string; variant: "default" | "neutral" | "success" | "warning" | "danger" | "info" }> = {
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
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      };
      setState(data.state);
      setUrl(data.url);
      if (data.state === "ERROR" && data.errorMessage) {
        toast.error("La preview n'a pas pu démarrer", {
          description: data.errorMessage,
        });
      }
    } catch {
      /* silent */
    }
  }, [projectId]);

  // Poll while in a transitional state (max ~5 minutes)
  useEffect(() => {
    if (!transitional(state)) {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setTimeout(fetchStatus, 4000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [state, fetchStatus]);

  const act = useCallback(
    async (action: "start" | "stop") => {
      setBusy(true);
      try {
        const res = await fetch(
          `/api/portal/projects/${projectId}/preview/${action}`,
          { method: "POST" }
        );
        const data = (await res.json()) as { state?: PreviewState; error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Action impossible");
          return;
        }
        if (data.state) setState(data.state);
        toast.success(
          action === "start" ? "Démarrage de la preview en cours…" : "Preview mise en veille"
        );
      } catch (err) {
        toast.error("Erreur réseau", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setBusy(false);
      }
    },
    [projectId]
  );

  if (state === "NONE") return null;
  const meta = labels[state];

  return (
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
          disabled={busy}
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
  );
}
