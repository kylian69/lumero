"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Mail,
  KeyRound,
  ShieldCheck,
  Upload,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Status =
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string }
  | null;

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        status.kind === "ok"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      }`}
    >
      {status.message}
    </div>
  );
}

export type AccountUserSummary = {
  id: string;
  email: string;
  pendingEmail: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
};

export function AccountSettings({ user }: { user: AccountUserSummary }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AvatarCard user={user} />
      <IdentityCard user={user} />
      <EmailCard user={user} />
      <PasswordCard />
      <TwoFactorCard enabled={user.twoFactorEnabled} />
    </div>
  );
}

// ───────────────────── Avatar ─────────────────────

function initials(user: AccountUserSummary): string {
  const fn = (user.firstName ?? "").trim();
  const ln = (user.lastName ?? "").trim();
  if (fn || ln) return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || "?";
  const n = (user.name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/);
    return ((parts[0]?.charAt(0) ?? "") + (parts[1]?.charAt(0) ?? "")).toUpperCase();
  }
  return (user.email ?? "?").charAt(0).toUpperCase();
}

function AvatarCard({ user }: { user: AccountUserSummary }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<Status>(null);
  const avatarSrc = user.avatarUrl
    ? `/api/account/avatar/${encodeURIComponent(user.avatarUrl)}`
    : null;

  async function upload(file: File) {
    setBusy(true);
    setStatus(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/account/avatar", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ kind: "ok", message: "Avatar mis à jour" });
      router.refresh();
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  async function remove() {
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/account/avatar", { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setStatus({ kind: "ok", message: "Avatar supprimé" });
      router.refresh();
    } else {
      setStatus({ kind: "err", message: "Erreur" });
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Avatar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-primary/15 ring-1 ring-border">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-primary">
                {initials(user)}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              PNG, JPEG, WebP ou GIF. 2 Mo max. À défaut, vos initiales sont affichées.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Importer une image
                  </>
                )}
              </Button>
              {user.avatarUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={remove}
                >
                  <Trash2 className="h-4 w-4" /> Retirer
                </Button>
              )}
            </div>
            <StatusLine status={status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ───────────────────── Identity ─────────────────────

function IdentityCard({ user }: { user: AccountUserSummary }) {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState(user.firstName ?? "");
  const [lastName, setLastName] = React.useState(user.lastName ?? "");
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<Status>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setStatus({ kind: "ok", message: "Profil mis à jour" });
      router.refresh();
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Identité</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Prénom</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nom</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <StatusLine status={status} />
          <Button disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> Enregistrer
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ───────────────────── Email ─────────────────────

function EmailCard({ user }: { user: AccountUserSummary }) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<"idle" | "code">(
    user.pendingEmail ? "code" : "idle",
  );
  const [newEmail, setNewEmail] = React.useState(user.pendingEmail ?? "");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<Status>(null);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/account/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "request",
        newEmail,
        currentPassword: password,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setPhase("code");
      setPassword("");
      setStatus({
        kind: "ok",
        message: `Code envoyé à ${newEmail}. Vérifiez votre boîte de réception.`,
      });
      router.refresh();
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/account/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "confirm", code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setPhase("idle");
      setCode("");
      setNewEmail("");
      setStatus({ kind: "ok", message: "Adresse email mise à jour" });
      router.refresh();
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  async function cancel() {
    setBusy(true);
    await fetch("/api/account/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "cancel" }),
    });
    setBusy(false);
    setPhase("idle");
    setCode("");
    setNewEmail("");
    setStatus(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" /> Adresse email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-xl bg-muted/50 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Email actuel</p>
          <p className="mt-0.5 font-medium">{user.email}</p>
          {user.pendingEmail && (
            <p className="mt-1 text-xs text-amber-700">
              En attente de confirmation : {user.pendingEmail}
            </p>
          )}
        </div>

        {phase === "idle" ? (
          <form onSubmit={request} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nouvelle adresse
              </label>
              <Input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouvel-email@exemple.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Mot de passe actuel
              </label>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <StatusLine status={status} />
            <Button disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer le code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={confirm} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Code reçu par email
              </label>
              <Input
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Saisissez le code à 6 chiffres envoyé à {user.pendingEmail || newEmail}.
              </p>
            </div>
            <StatusLine status={status} />
            <div className="flex gap-2">
              <Button disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmer le changement"
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={cancel} disabled={busy}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────────────── Password ─────────────────────

function PasswordCard() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<Status>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (next !== confirm) {
      setStatus({ kind: "err", message: "Les mots de passe ne correspondent pas" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setStatus({ kind: "ok", message: "Mot de passe mis à jour" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> Mot de passe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Mot de passe actuel
            </label>
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Nouveau mot de passe
            </label>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">8 caractères minimum.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Confirmer le nouveau mot de passe
            </label>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <StatusLine status={status} />
          <Button disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ───────────────────── 2FA ─────────────────────

function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [secret, setSecret] = React.useState<string | null>(null);
  const [otpauth, setOtpauth] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<Status>(null);
  const [copied, setCopied] = React.useState(false);

  async function begin() {
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/account/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setSecret(data.secret);
      setOtpauth(data.otpauth);
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  async function enable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/account/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enable", code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setSecret(null);
      setOtpauth(null);
      setCode("");
      setStatus({ kind: "ok", message: "2FA activée" });
      router.refresh();
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/account/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable", password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setPassword("");
      setStatus({ kind: "ok", message: "2FA désactivée" });
      router.refresh();
    } else {
      setStatus({ kind: "err", message: data.error || "Erreur" });
    }
  }

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const qrSrc = otpauth
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauth)}`
    : null;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" /> Authentification à deux facteurs
          {enabled ? (
            <Badge variant="default">Activée</Badge>
          ) : (
            <Badge variant="neutral">Désactivée</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enabled ? (
          <form onSubmit={disable} className="max-w-sm space-y-4">
            <p className="text-sm text-muted-foreground">
              La 2FA est active. Pour la désactiver, confirmez avec votre mot de passe.
            </p>
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Mot de passe actuel"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <StatusLine status={status} />
            <Button variant="outline" disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Désactiver la 2FA"
              )}
            </Button>
          </form>
        ) : !secret ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Protégez votre compte avec une application d'authentification (Google Authenticator,
              1Password, Authy…).
            </p>
            <StatusLine status={status} />
            <Button onClick={begin} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Configurer la 2FA"
              )}
            </Button>
          </div>
        ) : (
          <form onSubmit={enable} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {qrSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSrc}
                  alt="QR code 2FA"
                  width={180}
                  height={180}
                  className="rounded-lg border bg-white p-2"
                />
              )}
              <div className="flex-1 space-y-3 text-sm">
                <p>
                  Scannez le QR code avec votre application d'authentification, ou saisissez la clé
                  manuellement :
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-md bg-muted px-2 py-1.5 text-xs">
                    {secret}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copySecret}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Puis entrez le code à 6 chiffres pour confirmer.
                </p>
              </div>
            </div>
            <Input
              inputMode="numeric"
              required
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="max-w-[180px]"
            />
            <StatusLine status={status} />
            <Button disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Activer la 2FA"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
