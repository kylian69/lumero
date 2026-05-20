"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  MessageComposer,
  type DraftAttachment,
} from "@/components/shared/message-composer";

const CATEGORIES = [
  { id: "TECHNIQUE", label: "Technique (bug, incident)" },
  { id: "FACTURATION", label: "Facturation / abonnement" },
  { id: "CONTENU", label: "Contenu / textes / photos" },
  { id: "FONCTIONNALITE", label: "Nouvelle fonctionnalité" },
  { id: "PREVIEW_ACCESS", label: "Accès preview (autoriser une personne)" },
  { id: "AUTRE", label: "Autre" },
];

type ProjectOption = { id: string; name: string };

export function NewTicketForm({
  initialCategory,
  initialSubject,
  projects = [],
  defaultProjectId,
}: {
  initialCategory: string;
  initialSubject: string;
  projects?: ProjectOption[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = React.useState(initialSubject);
  const [category, setCategory] = React.useState(initialCategory);
  const [priority, setPriority] = React.useState("NORMAL");
  const [content, setContent] = React.useState("");
  const [attachments, setAttachments] = React.useState<DraftAttachment[]>([]);
  const [projectId, setProjectId] = React.useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < 10) {
      setError("Le message doit faire au moins 10 caractères.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/portal/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        category,
        priority,
        content,
        projectId: projectId || undefined,
        attachments,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      router.push(`/portal/support/${data.ticketId}`);
    } else {
      setError(data.error || "Erreur lors de la création du ticket");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {projects.length > 1 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Projet concerné</label>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— Aucun projet spécifique —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Sujet</label>
        <Input
          required
          minLength={3}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex : Le formulaire de contact ne fonctionne plus"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Catégorie</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Priorité</label>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="LOW">Faible</option>
            <option value="NORMAL">Normale</option>
            <option value="HIGH">Haute</option>
            <option value="URGENT">Urgente</option>
          </Select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Votre message</label>
        <MessageComposer
          uploadEndpoint="/api/uploads/draft"
          content={content}
          onContentChange={setContent}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          placeholder="Décrivez votre demande avec le plus de détails possible (markdown supporté)…"
          hideSendButton
          minRows={6}
        />
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Envoyer le ticket
          </>
        )}
      </Button>
    </form>
  );
}
