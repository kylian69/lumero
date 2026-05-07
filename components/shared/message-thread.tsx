"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  MessageComposer,
  type DraftAttachment,
} from "@/components/shared/message-composer";
import {
  MarkdownView,
  formatBytes,
} from "@/components/shared/markdown-editor";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ThreadAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type ThreadMessage = {
  id: string;
  content: string;
  isInternal?: boolean;
  createdAt: string | Date;
  editedAt?: string | Date | null;
  deletedAt?: string | Date | null;
  authorId: string;
  author: {
    name?: string | null;
    email: string;
    role?: string;
  };
  attachments?: ThreadAttachment[];
};

const USER_EDIT_WINDOW_MS = 15 * 60 * 1000;

export type StatusOption = { value: string; label: string };

export type ThreadConfig = {
  /** "ticket" or "customization" — used for StatusBadge mapping */
  kind: "ticket" | "customization";
  /** POST endpoint for new messages */
  postEndpoint: string;
  /** PATCH/DELETE endpoint pattern, takes messageId */
  messageEndpoint: (messageId: string) => string;
  /** Upload endpoint for attachments (per-resource) */
  uploadEndpoint: string;
  /** Download URL builder for attachments */
  attachmentHref: (id: string) => string;
  /** PATCH endpoint for updating status/priority (admin) */
  resourceEndpoint?: string;
  /** Status select options */
  statusOptions?: StatusOption[];
  /** Priority select options */
  priorityOptions?: StatusOption[];
};

function AttachmentList({
  attachments,
  hrefBuilder,
  disabled,
}: {
  attachments: ThreadAttachment[];
  hrefBuilder: (id: string) => string;
  disabled?: boolean;
}) {
  if (!attachments.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) => {
        const isImage = a.mimeType.startsWith("image/");
        const href = hrefBuilder(a.id);
        if (disabled) {
          return (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
            >
              <Paperclip className="h-3 w-3" /> {a.filename}
            </span>
          );
        }
        if (isImage) {
          return (
            <a
              key={a.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-md border border-border/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={href}
                alt={a.filename}
                className="max-h-48 max-w-xs object-cover"
              />
            </a>
          );
        }
        return (
          <a
            key={a.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2 py-1 text-xs hover:bg-muted"
          >
            <Paperclip className="h-3 w-3" /> {a.filename}
            <span className="text-muted-foreground">({formatBytes(a.size)})</span>
          </a>
        );
      })}
    </div>
  );
}

export function MessageThread({
  config,
  subject,
  status,
  priority,
  category,
  messages,
  scope,
  allowStatusChange,
  currentUserId,
}: {
  config: ThreadConfig;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  messages: ThreadMessage[];
  scope: "portal" | "admin";
  allowStatusChange?: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [internal, setInternal] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editBusy, setEditBusy] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = React.useState(status);
  const [currentPriority, setCurrentPriority] = React.useState(priority);

  async function send({
    content,
    attachments,
  }: {
    content: string;
    attachments: DraftAttachment[];
  }) {
    const res = await fetch(config.postEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        attachments,
        ...(scope === "admin" ? { isInternal: internal } : {}),
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Erreur d'envoi");
    }
    setInternal(false);
    router.refresh();
  }

  async function saveEdit(
    messageId: string,
    data: { content: string; attachments: DraftAttachment[] },
    keepIds: string[],
    originalIds: string[],
  ) {
    const toRemove = originalIds.filter((id) => !keepIds.includes(id));
    const res = await fetch(config.messageEndpoint(messageId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: data.content,
        attachmentsToAdd: data.attachments,
        attachmentsToRemove: toRemove,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Erreur");
    }
    setEditingId(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const res = await fetch(config.messageEndpoint(confirmDeleteId), {
      method: "DELETE",
    });
    setDeleteBusy(false);
    if (res.ok) {
      setConfirmDeleteId(null);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setDeleteError(j.error || "Erreur lors de la suppression");
    }
  }

  async function updateStatus(newStatus: string) {
    if (scope !== "admin" || !config.resourceEndpoint) return;
    setCurrentStatus(newStatus);
    await fetch(config.resourceEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function updatePriority(newPriority: string) {
    if (scope !== "admin" || !config.resourceEndpoint) return;
    setCurrentPriority(newPriority);
    await fetch(config.resourceEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: newPriority }),
    });
    router.refresh();
  }

  const isAdmin = scope === "admin";

  function canModify(m: ThreadMessage) {
    if (m.deletedAt) return false;
    if (isAdmin) return true;
    if (m.authorId !== currentUserId) return false;
    const created = new Date(m.createdAt).getTime();
    return Date.now() - created <= USER_EDIT_WINDOW_MS;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{subject}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge kind={config.kind} value={currentStatus} />
                <StatusBadge kind="priority" value={currentPriority} />
                {category && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {category}
                  </span>
                )}
              </div>
            </div>
            {allowStatusChange && config.statusOptions && config.priorityOptions && (
              <div className="flex flex-wrap gap-2">
                <Select
                  value={currentStatus}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="h-9 w-auto"
                >
                  {config.statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={currentPriority}
                  onChange={(e) => updatePriority(e.target.value)}
                  className="h-9 w-auto"
                >
                  {config.priorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {messages.map((m) => {
          const isStaff = m.author.role === "ADMIN";
          const editing = editingId === m.id;
          const deleted = !!m.deletedAt;
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-2xl border p-4",
                deleted
                  ? "border-dashed border-border/60 bg-muted/30"
                  : m.isInternal
                    ? "border-amber-500/30 bg-amber-500/5"
                    : isStaff
                      ? "border-primary/20 bg-primary/5"
                      : "border-border/60 bg-card",
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 font-medium">
                  {m.isInternal && !deleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Lock className="h-3 w-3" /> Note interne
                    </span>
                  )}
                  {m.author.name || m.author.email}
                  {isStaff && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      Équipe Lumero
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {m.editedAt && !deleted && <span className="italic">modifié</span>}
                  {formatDateTime(m.createdAt)}
                  {!deleted && canModify(m) && !editing && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingId(m.id)}
                        className="rounded p-1 hover:bg-muted hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setConfirmDeleteId(m.id);
                        }}
                        className="rounded p-1 hover:bg-muted hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </span>
              </div>

              {deleted ? (
                <p className="text-sm italic text-muted-foreground">Message supprimé</p>
              ) : editing ? (
                <MessageComposer
                  uploadEndpoint={config.uploadEndpoint}
                  initialContent={m.content}
                  initialAttachments={[]}
                  busy={editBusy}
                  setBusy={setEditBusy}
                  submitLabel="Enregistrer"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(d) =>
                    saveEdit(
                      m.id,
                      d,
                      (m.attachments || []).map((a) => a.id),
                      (m.attachments || []).map((a) => a.id),
                    )
                  }
                />
              ) : (
                <>
                  <MarkdownView content={m.content} />
                  {m.attachments && m.attachments.length > 0 && (
                    <AttachmentList
                      attachments={m.attachments}
                      hrefBuilder={config.attachmentHref}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <MessageComposer
            uploadEndpoint={config.uploadEndpoint}
            placeholder={
              scope === "admin"
                ? "Écrire une réponse au client (markdown supporté)…"
                : "Répondre à l'équipe Lumero (markdown supporté)…"
            }
            showInternal={scope === "admin"}
            internal={internal}
            setInternal={setInternal}
            busy={sending}
            setBusy={setSending}
            onSubmit={send}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!confirmDeleteId}
        onClose={() => (deleteBusy ? null : setConfirmDeleteId(null))}
        labelledBy="delete-message-title"
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 id="delete-message-title" className="text-lg font-semibold">
                Supprimer ce message ?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Le message sera marqué comme supprimé et ne sera plus visible
                dans la conversation. Cette action est irréversible.
              </p>
              {deleteError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {deleteError}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleteBusy}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteBusy}
              className="bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 hover:-translate-y-0.5"
            >
              {deleteBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
