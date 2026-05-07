"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Paperclip, X, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".pdf", ".txt", ".csv", ".zip", ".json",
  ".doc", ".docx", ".xls", ".xlsx",
];

type FieldErrors = Partial<Record<"name" | "email" | "subject" | "message" | "files", string>>;

export function Contact() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next = [...files];
    let error: string | null = null;

    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_FILES) {
        error = `Maximum ${MAX_FILES} fichiers autorisés.`;
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        error = `"${file.name}" dépasse la taille maximale de 10 Mo.`;
        continue;
      }
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        error = `"${file.name}" : type de fichier non autorisé.`;
        continue;
      }
      if (!next.find((f) => f.name === file.name && f.size === file.size)) {
        next.push(file);
      }
    }

    setFiles(next);
    setFieldErrors((prev) => ({ ...prev, files: error ?? undefined }));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Le nom est requis.";
    if (!email.trim()) errors.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email invalide.";
    if (!subject.trim()) errors.subject = "Le sujet est requis.";
    if (!message.trim() || message.trim().length < 10)
      errors.message = "Le message doit faire au moins 10 caractères.";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("email", email.trim());
      form.append("subject", subject.trim());
      form.append("message", message.trim());
      for (const file of files) form.append("files", file);

      const res = await fetch("/api/contact-form", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? "Une erreur est survenue. Réessayez.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Impossible d'envoyer le message. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="py-24">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Une question ? Parlons-en.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Contactez l&apos;équipe Lumero directement. Nous répondons sous 24 à 48 h.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          {success ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-semibold">Message envoyé !</h3>
              <p className="text-muted-foreground">
                Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
                Un email de confirmation vous a été envoyé.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setName("");
                  setEmail("");
                  setSubject("");
                  setMessage("");
                  setFiles([]);
                }}
              >
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-border bg-card p-8 space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="text-sm font-medium">
                    Nom / Société <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="contact-name"
                    placeholder="Votre nom ou société"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="vous@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!fieldErrors.email}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="text-sm font-medium">
                  Sujet <span className="text-destructive">*</span>
                </label>
                <Input
                  id="contact-subject"
                  placeholder="De quoi s'agit-il ?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-invalid={!!fieldErrors.subject}
                />
                {fieldErrors.subject && (
                  <p className="text-xs text-destructive">{fieldErrors.subject}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium">
                  Message <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="contact-message"
                  placeholder="Décrivez votre demande..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-invalid={!!fieldErrors.message}
                />
                {fieldErrors.message && (
                  <p className="text-xs text-destructive">{fieldErrors.message}</p>
                )}
              </div>

              {/* File attachments */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Pièces jointes (facultatif)</p>
                <div
                  role="button"
                  tabIndex={0}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span>
                    Joindre des fichiers{" "}
                    <span className="text-xs opacity-60">
                      (max {MAX_FILES} fichiers · 10 Mo chacun)
                    </span>
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  accept={ALLOWED_EXTENSIONS.join(",")}
                  onChange={(e) => addFiles(e.target.files)}
                  onClick={(e) => ((e.target as HTMLInputElement).value = "")}
                />
                {fieldErrors.files && (
                  <p className="text-xs text-destructive">{fieldErrors.files}</p>
                )}
                {files.length > 0 && (
                  <ul className="space-y-1">
                    {files.map((file, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          aria-label={`Retirer ${file.name}`}
                          onClick={() => removeFile(i)}
                          className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {serverError && (
                <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  "Envoi en cours…"
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
