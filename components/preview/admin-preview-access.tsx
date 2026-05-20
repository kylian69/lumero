"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Grant = {
  id: string;
  user: { id: string; name: string | null; email: string };
};

export function AdminPreviewAccess({
  projectId,
  defaultEmail,
}: {
  projectId: string;
  defaultEmail?: string;
}) {
  const [grants, setGrants] = React.useState<Grant[]>([]);
  const [email, setEmail] = React.useState(defaultEmail ?? "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const base = `/api/admin/projects/${projectId}/preview-access`;

  const load = React.useCallback(async () => {
    const res = await fetch(base);
    if (res.ok) {
      const data = await res.json();
      setGrants(data.grants ?? []);
    }
  }, [base]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEmail("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function revoke(userId: string) {
    await fetch(base, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accès preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={grant} className="space-y-2">
          <Input
            type="email"
            placeholder="email@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" size="sm" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Autoriser l'accès"
            )}
          </Button>
          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </form>

        <div className="space-y-2">
          {grants.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucun accès accordé (hors propriétaire et admins).
            </p>
          ) : (
            grants.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
              >
                <span className="truncate">
                  {g.user.name ? `${g.user.name} · ` : ""}
                  {g.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => revoke(g.user.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Révoquer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
