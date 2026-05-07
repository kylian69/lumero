"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Mail, Phone, Trash2, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { BulkDeleteDialog } from "@/components/admin/prospects-list";
import { EmptyState } from "@/components/shared/empty-state";
import { formatEUR, formatDate } from "@/lib/format";
import type { SubscriptionStatus, SubscriptionTier } from "@prisma/client";

type ClientItem = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: Date | string;
  projects: { id: string; status: string; name: string }[];
  subscriptions: {
    id: string;
    tier: SubscriptionTier;
    monthlyAmount: number;
    status: SubscriptionStatus;
  }[];
};

export function ClientsList({
  clients,
  showArchived,
}: {
  clients: ClientItem[];
  showArchived: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const allIds = clients.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function bulkAction(action: string) {
    setLoading(true);
    const res = await fetch("/api/admin/clients/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ids: [...selected] }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Erreur");
      return;
    }
    const verb =
      action === "delete"
        ? "supprimé"
        : action === "archive"
          ? "archivé"
          : "désarchivé";
    toast.success(`${data.count} client${data.count > 1 ? "s" : ""} ${verb}${data.count > 1 ? "s" : ""}.`);
    setSelected(new Set());
    setDeleteDialogOpen(false);
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun client"
        description="Les clients apparaîtront ici dès qu'ils auront un compte."
      />
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {/* Select-all header */}
            <div className="flex items-center gap-3 px-5 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border accent-primary"
                aria-label="Tout sélectionner"
              />
              <span className="text-xs text-muted-foreground">
                {someSelected
                  ? `${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`
                  : "Tout sélectionner"}
              </span>
            </div>

            {clients.map((c) => {
              const activeSub = c.subscriptions[0];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleOne(c.id)}
                    className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                    aria-label={`Sélectionner ${c.name || c.email}`}
                  />
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(c.name || c.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.name || "—"}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </span>
                          {c.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                          <span>depuis {formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {c.projects.length > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          {c.projects.length} projet{c.projects.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {activeSub ? (
                        <>
                          <StatusBadge kind="subscription" value={activeSub.status} />
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            {activeSub.tier} · {formatEUR(activeSub.monthlyAmount)}/mois
                          </span>
                        </>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          Sans abonnement
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        {showArchived ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkAction("unarchive")}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
            )}
            Désarchiver
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkAction("archive")}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Archive className="mr-1.5 h-3.5 w-3.5" />
            )}
            Archiver
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loading}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Supprimer
        </Button>
      </BulkActionBar>

      <BulkDeleteDialog
        open={deleteDialogOpen}
        count={selected.size}
        loading={loading}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => bulkAction("delete")}
        label="client"
      />
    </>
  );
}
