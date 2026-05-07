"use client";

import * as React from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DraftAttachment,
  MarkdownToolbar,
  MarkdownView,
  formatBytes,
} from "@/components/shared/markdown-editor";

export type { DraftAttachment } from "@/components/shared/markdown-editor";

export function MessageComposer({
  uploadEndpoint,
  initialContent = "",
  initialAttachments = [],
  attachments: controlledAttachments,
  onAttachmentsChange,
  content: controlledContent,
  onContentChange,
  placeholder,
  showInternal,
  internal,
  setInternal,
  submitLabel = "Envoyer",
  onSubmit,
  onCancel,
  busy,
  setBusy,
  hideSendButton,
  minRows = 5,
}: {
  uploadEndpoint: string;
  initialContent?: string;
  initialAttachments?: DraftAttachment[];
  attachments?: DraftAttachment[];
  onAttachmentsChange?: (atts: DraftAttachment[]) => void;
  content?: string;
  onContentChange?: (val: string) => void;
  placeholder?: string;
  showInternal?: boolean;
  internal?: boolean;
  setInternal?: (v: boolean) => void;
  submitLabel?: string;
  onSubmit?: (data: { content: string; attachments: DraftAttachment[] }) => Promise<void>;
  onCancel?: () => void;
  busy?: boolean;
  setBusy?: (v: boolean) => void;
  hideSendButton?: boolean;
  minRows?: number;
}) {
  const [internalContent, setInternalContent] = React.useState(initialContent);
  const content = controlledContent ?? internalContent;
  const setContent = (v: string) => {
    if (onContentChange) onContentChange(v);
    else setInternalContent(v);
  };

  const [internalAtts, setInternalAtts] =
    React.useState<DraftAttachment[]>(initialAttachments);
  const attachments = controlledAttachments ?? internalAtts;
  const setAttachments = (
    updater: DraftAttachment[] | ((prev: DraftAttachment[]) => DraftAttachment[]),
  ) => {
    const next =
      typeof updater === "function"
        ? (updater as (p: DraftAttachment[]) => DraftAttachment[])(attachments)
        : updater;
    if (onAttachmentsChange) onAttachmentsChange(next);
    else setInternalAtts(next);
  };

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
      const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
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
    if (!onSubmit) return;
    if (!content.trim()) return;
    setBusy?.(true);
    setError(null);
    try {
      await onSubmit({ content, attachments });
      setContent("");
      setAttachments([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy?.(false);
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
            placeholder={placeholder ?? "Écrire un message (markdown supporté)…"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={minRows}
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

      {error && <p className="text-xs text-destructive">{error}</p>}

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
        {!hideSendButton && (
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
        )}
      </div>
    </div>
  );
}
