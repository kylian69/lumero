"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mailbox, Phone, Calendar, Trash2, Archive, Tag, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelative } from "@/lib/format";
import type { ProspectStatus } from "@prisma/client";

type ProspectItem = {
  id: string;
  companyName: string;
  email: string;
  phone: string | null;
  status: ProspectStatus;
  createdAt: Date | string;
  questionnaire: { id: string } | null;
  quoteRequests: { id: string }[];
};

const STATUS_LABELS: Record<ProspectStatus, string> = {
  NEW: "Nouveaux",
  CONTACTED: "Contactés",
  QUALIFIED: "Qualifiés",
  PROPOSAL_SENT: "Devis envoyé",
  NEGOTIATING: "Négociation",
  WON: "Gagnés",
  LOST: "Perdus",
  ARCHIVED: "Archivés",
};

const SELECTABLE_STATUSES: ProspectStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "WON",
  "LOST",
  "ARCHIVED",
];

export function ProspectsList({ prospects }: { prospects: ProspectItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const allIds = prospects.map((p) => p.id);
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

  async function bulkAction(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch("/api/admin/prospects/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ids: [...selected], ...extra }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Erreur");
      return;
    }
    toast.success(`${data.count} prospect${data.count > 1 ? "s" : ""} mis à jour.`);
    setSelected(new Set());
    setStatusDialogOpen(false);
    setDeleteDialogOpen(false);
    router.refresh();
  }

  if (prospects.length === 0) {
    return (
      <EmptyState
        icon={Mailbox}
        title="Aucun prospect"
        description="Les prospects apparaîtront ici dès qu'une personne soumettra le questionnaire ou une demande de devis."
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

            {prospects.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleOne(p.id)}
                  className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                  aria-label={`Sélectionner ${p.companyName}`}
                  onClick={(e) => e.stopPropagation()}
                />
                <Link
                  href={`/admin/prospects/${p.id}`}
                  className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{p.companyName}</p>
                      <StatusBadge kind="prospect" value={p.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Mailbox className="h-3 w-3" />
                        {p.email}
                      </span>
                      {p.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {p.phone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelative(p.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:flex-nowrap">
                    {p.questionnaire && (
                      <span className="rounded-full bg-muted px-2 py-0.5">Questionnaire</span>
                    )}
                    {p.quoteRequests.length > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {p.quoteRequests.length} devis
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatusDialogOpen(true)}
          disabled={loading}
        >
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          Changer le statut
        </Button>
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

      {/* Change status dialog */}
      <ChangeStatusDialog
        open={statusDialogOpen}
        count={selected.size}
        loading={loading}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={(status) => bulkAction("status", { status })}
      />

      {/* Delete confirmation dialog */}
      <BulkDeleteDialog
        open={deleteDialogOpen}
        count={selected.size}
        loading={loading}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => bulkAction("delete")}
        label="prospect"
      />
    </>
  );
}

function ChangeStatusDialog({
  open,
  count,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (status: ProspectStatus) => void;
}) {
  const [status, setStatus] = React.useState<ProspectStatus>("CONTACTED");

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(status);
        }}
      >
        <h2 className="mb-1 text-lg font-semibold">Changer le statut</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Appliquer un nouveau statut à {count} prospect{count > 1 ? "s" : ""}.
        </p>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProspectStatus)}
        >
          {SELECTABLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Appliquer
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function BulkDeleteDialog({
  open,
  count,
  loading,
  onClose,
  onConfirm,
  label,
}: {
  open: boolean;
  count: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm();
        }}
      >
        <h2 className="mb-1 text-lg font-semibold">Supprimer {count} {label}{count > 1 ? "s" : ""} ?</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Cette action est irréversible. Toutes les données associées seront définitivement supprimées.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
