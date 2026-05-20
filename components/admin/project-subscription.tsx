"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatEUR, formatDate } from "@/lib/format";
import { monthlyPricesForPlan, type PlanType } from "@/lib/pricing";

export type ProjectSubscription = {
  id: string;
  tier: "NONE" | "LIGHT" | "COMPLETE";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "PAUSED";
  monthlyAmount: number; // centimes (storage unit)
  currency: string;
  currentPeriodEnd: Date | string;
};

type Props = {
  projectId: string;
  planType: PlanType;
  subscription: ProjectSubscription | null;
};

const TIER_LABELS: Record<ProjectSubscription["tier"], string> = {
  NONE: "Aucun abonnement",
  LIGHT: "Light",
  COMPLETE: "Complet",
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

// Convertit centimes → euros pour l'affichage du champ (sans arrondi destructif).
function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}

function eurosToCents(eur: number): number {
  return Math.round(eur * 100);
}

export function ProjectSubscription({
  projectId,
  planType,
  subscription: initialSubscription,
}: Props) {
  const router = useRouter();
  // Prix de référence (euros) pour la formule du projet : Light/Complet
  // n'ont pas le même tarif selon Start/Standard/Pro.
  const tierPricesEur = React.useMemo(() => {
    const cents = monthlyPricesForPlan(planType);
    return {
      NONE: cents.NONE / 100,
      LIGHT: cents.LIGHT / 100,
      COMPLETE: cents.COMPLETE / 100,
    } as Record<ProjectSubscription["tier"], number>;
  }, [planType]);
  // État local de l'abonnement courant : mis à jour immédiatement après save
  // pour que le badge de statut reflète le changement sans rafraîchir la page.
  const [subscription, setSubscription] = React.useState<ProjectSubscription | null>(
    initialSubscription,
  );
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [tier, setTier] = React.useState<ProjectSubscription["tier"]>(
    initialSubscription?.tier ?? "LIGHT",
  );
  const [status, setStatus] = React.useState<ProjectSubscription["status"]>(
    initialSubscription?.status ?? "ACTIVE",
  );
  const [amountEur, setAmountEur] = React.useState<number>(
    initialSubscription
      ? centsToEuros(initialSubscription.monthlyAmount)
      : tierPricesEur.LIGHT,
  );
  const [periodEnd, setPeriodEnd] = React.useState<string>(
    initialSubscription
      ? toDateInput(initialSubscription.currentPeriodEnd)
      : defaultPeriodEnd(),
  );

  // Synchronise les valeurs si le parent fournit un nouvel abonnement.
  React.useEffect(() => {
    setSubscription(initialSubscription);
  }, [initialSubscription]);

  function resetForm(sub: ProjectSubscription | null) {
    if (sub) {
      setTier(sub.tier);
      setStatus(sub.status);
      setAmountEur(centsToEuros(sub.monthlyAmount));
      setPeriodEnd(toDateInput(sub.currentPeriodEnd));
    } else {
      setTier("LIGHT");
      setStatus("ACTIVE");
      setAmountEur(tierPricesEur.LIGHT);
      setPeriodEnd(defaultPeriodEnd());
    }
  }

  function openEditor() {
    setError(null);
    resetForm(subscription);
    setEditing(true);
  }

  function cancelEditor() {
    setEditing(false);
    setError(null);
    resetForm(subscription);
  }

  function onTierChange(value: ProjectSubscription["tier"]) {
    setTier(value);
    if (tierPricesEur[value] !== undefined) {
      setAmountEur(tierPricesEur[value]);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const monthlyAmount = eurosToCents(amountEur);
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
        setSubscription(data.subscription);
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
        setSubscription(data.subscription);
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
      setSubscription(null);
      setEditing(false);
      resetForm(null);
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
              <span className="font-medium">{TIER_LABELS[subscription.tier]}</span>
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
            <option value="NONE">Aucun abonnement</option>
            <option value="LIGHT">Light ({tierPricesEur.LIGHT} €/mois)</option>
            <option value="COMPLETE">
              Complet ({tierPricesEur.COMPLETE} €/mois)
            </option>
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
          <span className="text-muted-foreground">Montant mensuel (€)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amountEur}
            onChange={(e) => setAmountEur(Number(e.target.value))}
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
