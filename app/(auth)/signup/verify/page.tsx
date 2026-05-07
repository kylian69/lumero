"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupVerifyPage() {
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
      <Verify />
    </React.Suspense>
  );
}

function Verify() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = React.useState<
    | { kind: "loading" }
    | { kind: "ok"; email: string }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  React.useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Token manquant." });
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setState({
          kind: "error",
          message: data.error || "Lien invalide ou expiré.",
        });
        return;
      }
      setState({ kind: "ok", email: data.email });
      setTimeout(
        () => router.push(`/login?email=${encodeURIComponent(data.email)}`),
        1500,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (state.kind === "loading") {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/signup" className="text-sm underline">
            Recommencer l'inscription
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compte activé</CardTitle>
        <CardDescription>
          Votre compte ({state.email}) est confirmé. Redirection vers la
          connexion…
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
