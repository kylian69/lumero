"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatEUR, formatDate } from "@/lib/format";

export type ProjectSubscription = {
  id: string;
  tier: "NONE" | "LIGHT" | "COMPLETE";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "PAUSED";
  monthlyAmount: number;
  currency: string;
  currentPeriodEnd: Date | string;
};

type Props = {
  projectId: string;
  subscription: ProjectSubscription | null;
};

const TIER_PRICES: Record<string, number> = {
  NONE: 0,
  LIGHT: 1900,
  COMPLETE: 4900,
};

function toDateInput(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function defaultPeriodEnd(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function ProjectSubscription({ projectId, subscription }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [tier, setTier] = React.useState<ProjectSubscription["tier"]>(
    subscription?.tier ?? "LIGHT",
  );
  const [status, setStatus] = React.useState<ProjectSubscription["status"]>(
    subscription?.status ?? "ACTIVE",
  );
  const [monthlyAmount, setMonthlyAmount] = React.useState<number>(
    subscription?.monthlyAmount ?? TIER_PRICES.LIGHT,
  );
  const [periodEnd, setPeriodEnd] = React.useState<string>(
    subscription ? toDateInput(subscription.currentPeriodEnd) : defaultPeriodEnd(),
  );

  React.useEffect(() => {
    if (subscription) {
      setTier(subscription.tier);
      setStatus(subscription.status);
      setMonthlyAmount(subscription.monthlyAmount);
      setPeriodEnd(toDateInput(subscription.currentPeriodEnd));
    }
  }, [subscription]);

  function openEditor() {
    setError(null);
    setEditing(true);
  }

  function cancelEditor() {
    setEditing(false);
    setError(null);
    if (subscription) {
      setTier(subscription.tier);
      setStatus(subscription.status);
      setMonthlyAmount(subscription.monthlyAmount);
      setPeriodEnd(toDateInput(subscription.currentPeriodEnd));
    } else {
      setTier("LIGHT");
      setStatus("ACTIVE");
      setMonthlyAmount(TIER_PRICES.LIGHT);
      setPeriodEnd(defaultPeriodEnd());
    }
  }

  function onTierChange(value: ProjectSubscription["tier"]) {
    setTier(value);
    setMonthlyAmount(TIER_PRICES[value] ?? monthlyAmount);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      if (subscription) {
        const res = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier,
            status,
            monthlyAmount,
            currentPeriodEnd: new Date(periodEnd).toISOString(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erreur lors de la mise à jour");
          return;
        }
      } else {
        const res = await fetch(`/api/admin/subscriptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            tier,
            monthlyAmount,
            currentPeriodEnd: new Date(periodEnd).toISOString(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erreur lors de la création");
          return;
        }
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!subscription) return;
    if (!confirm("Supprimer cet abonnement ?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur lors de la suppression");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          {subscription ? (
            <>
              <span className="font-medium">
                {subscription.tier === "NONE" ? "Sans formule" : subscription.tier}
              </span>
              <StatusBadge kind="subscription" value={subscription.status} />
              <span className="text-muted-foreground">
                {formatEUR(subscription.monthlyAmount)}/mois · jusqu'au{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Aucun abonnement</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={openEditor}
          className="h-7 gap-1 px-2 text-xs"
        >
          {subscription ? (
            <>
              <Pencil className="h-3 w-3" /> Modifier
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" /> Ajouter
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
      <div className="flex items-center gap-2 font-medium">
        <CreditCard className="h-3.5 w-3.5 text-primary" />
        {subscription ? "Modifier l'abonnement" : "Créer un abonnement"}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Formule</span>
          <select
            value={tier}
            onChange={(e) =>
              onTierChange(e.target.value as ProjectSubscription["tier"])
            }
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="NONE">Aucune</option>
            <option value="LIGHT">Light</option>
            <option value="COMPLETE">Complet</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Statut</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as ProjectSubscription["status"])
            }
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="ACTIVE">Actif</option>
            <option value="PAUSED">En pause</option>
            <option value="PAST_DUE">Impayé</option>
            <option value="CANCELED">Annulé</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Montant mensuel (centimes)</span>
          <input
            type="number"
            min={0}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Fin de période</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </label>
      </div>
      {error && <p className="text-rose-600">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={busy} className="h-7 gap-1 px-2 text-xs">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Enregistrer
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelEditor}
            disabled={busy}
            className="h-7 gap-1 px-2 text-xs"
          >
            <X className="h-3 w-3" /> Annuler
          </Button>
        </div>
        {subscription && (
          <Button
            size="sm"
            variant="ghost"
            onClick={remove}
            disabled={busy}
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" /> Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
