"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";

export function CancelSubscription({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Une erreur est survenue.");
        return;
      }
      setOpen(false);
      if (json.ticketId) {
        router.push(`/portal/support/${json.ticketId}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4" />
        Annuler l'abonnement
      </Button>

      <Dialog open={open} onClose={() => !busy && setOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Annuler votre abonnement</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre abonnement sera annulé immédiatement. Un ticket de support est
            automatiquement créé afin que notre équipe finalise la résiliation et
            reste à votre écoute.
          </p>
          <label className="mt-4 block text-sm font-medium">
            Motif (facultatif)
          </label>
          <Textarea
            className="mt-2"
            placeholder="Dites-nous pourquoi vous annulez (facultatif)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Revenir
            </Button>
            <Button
              className="bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25"
              onClick={confirm}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Confirmer l'annulation
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
