"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AcceptInvitePage() {
  return (
    <React.Suspense
      fallback={
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }
    >
      <AcceptInviteForm />
    </React.Suspense>
  );
}

type InviteInfo = {
  valid: boolean;
  error?: string;
  user?: { email: string; name: string | null; role: string };
};

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [info, setInfo] = React.useState<InviteInfo | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setInfo({ valid: false, error: "Token manquant." });
      return;
    }
    fetch(`/api/auth/accept-invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => setInfo({ valid: false, error: "Erreur réseau." }));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!info) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!info.valid) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invitation invalide</CardTitle>
          <CardDescription>{info.error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm underline">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Compte activé</CardTitle>
          <CardDescription>
            Vous allez être redirigé·e vers la page de connexion…
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activer votre compte</CardTitle>
        <CardDescription>
          Bienvenue {info.user?.name || info.user?.email}. Choisissez un mot de
          passe pour activer votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input value={info.user?.email ?? ""} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Mot de passe
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Confirmer le mot de passe
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activer mon compte
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
