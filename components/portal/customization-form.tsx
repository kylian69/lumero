"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const CATEGORIES = [
  { id: "contenu", label: "Texte & contenu" },
  { id: "design", label: "Design & couleurs" },
  { id: "fonctionnalite", label: "Nouvelle fonctionnalité" },
  { id: "seo", label: "SEO / référencement" },
  { id: "autre", label: "Autre" },
];

type ProjectOption = { id: string; name: string };

export function CustomizationForm({
  projects = [],
  defaultProjectId,
}: {
  projects?: ProjectOption[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("contenu");
  const [priority, setPriority] = React.useState("NORMAL");
  const [projectId, setProjectId] = React.useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<"ok" | "err" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const res = await fetch("/api/portal/customization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        priority,
        projectId: projectId || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setTitle("");
      setDescription("");
      setCategory("contenu");
      setPriority("NORMAL");
      setResult("ok");
      router.refresh();
      setTimeout(() => setResult(null), 3000);
    } else {
      setResult("err");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {projects.length > 1 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Projet concerné</label>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Titre de la demande
        </label>
        <Input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Changer la couleur du bouton principal"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Catégorie</label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Priorité</label>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="LOW">Faible</option>
            <option value="NORMAL">Normale</option>
            <option value="HIGH">Haute</option>
          </Select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Description détaillée
        </label>
        <Textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez précisément ce que vous souhaitez modifier. Plus vous êtes précis, plus on est rapide !"
        />
      </div>
      {result === "ok" && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          Demande envoyée ! Notre équipe vous répond sous 24-48h.
        </div>
      )}
      {result === "err" && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          Impossible d'envoyer votre demande. Merci de réessayer.
        </div>
      )}
      <Button disabled={submitting} size="lg" className="w-full">
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Envoyer ma demande
          </>
        )}
      </Button>
    </form>
  );
}
