"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RequestAccessButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function request() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/preview/request-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Une erreur est survenue.");
      }
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
        Votre demande a été envoyée. Un administrateur la traitera prochainement.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={request} disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Demander l'accès"}
      </Button>
      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
