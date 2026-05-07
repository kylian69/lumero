"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
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
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = React.useState(params.get("email") ?? "");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [needOtp, setNeedOtp] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      otp,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === "OTP_REQUIRED") {
        setNeedOtp(true);
        setError("Saisissez le code à 6 chiffres de votre application d'authentification.");
        return;
      }
      if (res.error === "OTP_INVALID") {
        setNeedOtp(true);
        setError("Code 2FA incorrect.");
        return;
      }
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push(next || "/portal");
    router.refresh();
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Se connecter</CardTitle>
        <CardDescription>
          Accédez à votre espace pour piloter votre site, votre abonnement et
          votre support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {needOtp && (
            <div>
              <label htmlFor="otp" className="mb-1.5 block text-sm font-medium">
                Code 2FA
              </label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
            </div>
          )}
          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Se connecter"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link
              href="/forgot-password"
              className="font-medium text-primary"
            >
              Mot de passe oublié ?
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-medium text-primary">
              Créer un compte
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
