"use client";

import * as React from "react";
import Link from "next/link";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vérifiez votre email</CardTitle>
          <CardDescription>
            Si un compte existe pour <strong>{email}</strong>, un lien de
            réinitialisation vient d'être envoyé. Le lien expire dans 30
            minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm underline">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Saisissez votre email pour recevoir un lien de réinitialisation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Envoyer le lien"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="font-medium text-primary">
              Retour à la connexion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
