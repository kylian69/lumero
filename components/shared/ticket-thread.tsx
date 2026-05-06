"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Lock,
  Paperclip,
  Pencil,
  Quote,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
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

function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

type DraftAttachment = {
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
};

function MarkdownToolbar({
  textareaRef,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (val: string) => void;
}) {
  function wrap(before: string, after = before, placeholder = "texte") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }
  function prefixLines(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const replaced = block
      .split("\n")
      .map((l) => (l.length ? prefix + l : prefix + "élément"))
      .join("\n");
    onChange(value.slice(0, lineStart) + replaced + value.slice(end));
  }
  const btn =
    "h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground";
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-1 py-1">
      <button type="button" className={btn} title="Gras" onClick={() => wrap("**")}>
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" className={btn} title="Italique" onClick={() => wrap("*")}>
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" className={btn} title="Code" onClick={() => wrap("`")}>
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Lien"
        onClick={() => wrap("[", "](https://)", "lien")}
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Liste à puces"
        onClick={() => prefixLines("- ")}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Liste numérotée"
        onClick={() => prefixLines("1. ")}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Citation"
        onClick={() => prefixLines("> ")}
      >
        <Quote className="h-4 w-4" />
      </button>
    </div>
  );
}

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function AttachmentList({
  attachments,
  disabled,
}: {
  attachments: ThreadAttachment[];
  disabled?: boolean;
}) {
  if (!attachments.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) => {
        const isImage = a.mimeType.startsWith("image/");
        const href = `/api/tickets/attachments/${a.id}`;
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

function Composer({
  ticketId,
  scope,
  initialContent = "",
  initialAttachments = [],
  showInternal,
  internal,
  setInternal,
  submitLabel = "Envoyer",
  onSubmit,
  onCancel,
  busy,
  setBusy,
}: {
  ticketId: string;
  scope: "portal" | "admin";
  initialContent?: string;
  initialAttachments?: DraftAttachment[];
  showInternal?: boolean;
  internal?: boolean;
  setInternal?: (v: boolean) => void;
  submitLabel?: string;
  onSubmit: (data: { content: string; attachments: DraftAttachment[] }) => Promise<void>;
  onCancel?: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const [content, setContent] = React.useState(initialContent);
  const [attachments, setAttachments] = React.useState<DraftAttachment[]>(
    initialAttachments,
  );
  const [preview, setPreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Erreur d'envoi");
      } else {
        setAttachments((prev) => [...prev, ...json.files]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit() {
    if (!content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ content, attachments });
      setContent("");
      setAttachments([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-1">
          <MarkdownToolbar textareaRef={taRef} onChange={setContent} />
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            {preview ? "Éditer" : "Aperçu"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[120px] p-3">
            {content.trim() ? (
              <MarkdownView content={content} />
            ) : (
              <p className="text-sm text-muted-foreground">Rien à prévisualiser.</p>
            )}
          </div>
        ) : (
          <Textarea
            ref={taRef}
            placeholder={
              scope === "admin"
                ? "Écrire une réponse au client (markdown supporté)…"
                : "Répondre à l'équipe Lumero (markdown supporté)…"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="border-0 focus-visible:ring-0"
          />
        )}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <span
              key={a.storageKey}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2 py-1 text-xs"
            >
              <Paperclip className="h-3 w-3" /> {a.filename}
              <span className="text-muted-foreground">({formatBytes(a.size)})</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) =>
                    prev.filter((x) => x.storageKey !== a.storageKey),
                  )
                }
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            Joindre
          </Button>
          {showInternal && (
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal?.(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Note interne (invisible au client)
            </label>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button onClick={submit} disabled={busy || !content.trim()}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" /> {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TicketThread({
  ticketId,
  subject,
  status,
  priority,
  category,
  messages,
  scope,
  allowStatusChange,
  currentUserId,
}: {
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
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

  const postEndpoint =
    scope === "portal"
      ? `/api/portal/tickets/${ticketId}/messages`
      : `/api/admin/tickets/${ticketId}/messages`;

  async function send({
    content,
    attachments,
  }: {
    content: string;
    attachments: DraftAttachment[];
  }) {
    const res = await fetch(postEndpoint, {
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
    const res = await fetch(`/api/tickets/${ticketId}/messages/${messageId}`, {
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
    const res = await fetch(
      `/api/tickets/${ticketId}/messages/${confirmDeleteId}`,
      { method: "DELETE" },
    );
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
    if (scope !== "admin") return;
    setCurrentStatus(newStatus);
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function updatePriority(newPriority: string) {
    if (scope !== "admin") return;
    setCurrentPriority(newPriority);
    await fetch(`/api/admin/tickets/${ticketId}`, {
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
                <StatusBadge kind="ticket" value={currentStatus} />
                <StatusBadge kind="priority" value={currentPriority} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {category}
                </span>
              </div>
            </div>
            {allowStatusChange && (
              <div className="flex flex-wrap gap-2">
                <Select
                  value={currentStatus}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="h-9 w-auto"
                >
                  <option value="OPEN">Ouvert</option>
                  <option value="WAITING_STAFF">À traiter</option>
                  <option value="WAITING_CLIENT">Attente client</option>
                  <option value="RESOLVED">Résolu</option>
                  <option value="CLOSED">Fermé</option>
                </Select>
                <Select
                  value={currentPriority}
                  onChange={(e) => updatePriority(e.target.value)}
                  className="h-9 w-auto"
                >
                  <option value="LOW">Faible</option>
                  <option value="NORMAL">Normale</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgent</option>
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
                  {m.editedAt && !deleted && (
                    <span className="italic">modifié</span>
                  )}
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
                <p className="text-sm italic text-muted-foreground">
                  Message supprimé
                </p>
              ) : editing ? (
                <Composer
                  ticketId={ticketId}
                  scope={scope}
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
                    <AttachmentList attachments={m.attachments} />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Composer
            ticketId={ticketId}
            scope={scope}
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
              <h2
                id="delete-message-title"
                className="text-lg font-semibold"
              >
                Supprimer ce message ?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Le message sera marqué comme supprimé et ne sera plus visible
                dans la conversation. Cette action est irréversible.
              </p>
              {deleteError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
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
