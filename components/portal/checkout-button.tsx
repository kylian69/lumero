"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type Props = {
  endpoint: string;
  payload: Record<string, unknown>;
  children: React.ReactNode;
} & Omit<ButtonProps, "onClick">;

/**
 * Lance une session Stripe Checkout puis redirige le navigateur vers l'URL
 * hébergée par Stripe (paiement sécurisé, PCI-DSS pris en charge par Stripe).
 */
export function CheckoutButton({ endpoint, payload, children, ...buttonProps }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) {
        setError(json.error ?? "Le paiement n'a pas pu être initié.");
        setBusy(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Une erreur réseau est survenue.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <Button {...buttonProps} onClick={start} disabled={busy || buttonProps.disabled}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
