"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConsentUpdate } from "@/lib/cookie-consent";
import { useCookieConsent } from "./provider";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  id?: string;
}

function Toggle({ checked, onChange, disabled, id }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-muted",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

const CATEGORIES = [
  {
    key: "necessary" as const,
    label: "Cookies nécessaires",
    description:
      "Indispensables au fonctionnement du site : authentification, sécurité des sessions. Ces cookies ne peuvent pas être désactivés.",
    always: true,
  },
  {
    key: "preferences" as const,
    label: "Cookies de préférences",
    description:
      "Mémorisent vos choix (thème clair/sombre, etc.) pour personnaliser votre expérience lors de vos prochaines visites.",
    always: false,
  },
  {
    key: "analytics" as const,
    label: "Cookies analytiques",
    description:
      "Nous aident à comprendre comment les visiteurs utilisent le site (pages consultées, durée de session, sources de trafic). Données anonymisées.",
    always: false,
  },
  {
    key: "marketing" as const,
    label: "Cookies marketing",
    description:
      "Permettent de vous proposer des contenus publicitaires pertinents sur d'autres sites et de mesurer l'efficacité de nos campagnes.",
    always: false,
  },
] as const;

type OptionalKey = "preferences" | "analytics" | "marketing";

export function CookiePreferencesModal() {
  const {
    consent,
    preferencesOpen,
    closePreferences,
    savePreferences,
    acceptAll,
    refuseAll,
  } = useCookieConsent();

  const [local, setLocal] = useState<ConsentUpdate>({
    preferences: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (preferencesOpen) {
      setLocal({
        preferences: consent?.preferences ?? false,
        analytics: consent?.analytics ?? false,
        marketing: consent?.marketing ?? false,
      });
    }
  }, [preferencesOpen, consent]);

  return (
    <Dialog
      open={preferencesOpen}
      onClose={closePreferences}
      labelledBy="cookie-prefs-title"
      describedBy="cookie-prefs-desc"
    >
      <div className="p-6 sm:p-8">
        <h2 id="cookie-prefs-title" className="pr-8 text-xl font-semibold">
          Paramètres des cookies
        </h2>
        <p id="cookie-prefs-desc" className="mt-1 text-sm text-muted-foreground">
          Gérez vos préférences par catégorie. Les cookies nécessaires ne peuvent pas être
          désactivés car ils sont indispensables au bon fonctionnement du site.
        </p>

        <div className="mt-6 space-y-3">
          {CATEGORIES.map(({ key, label, description, always }) => (
            <div
              key={key}
              className="flex items-start gap-4 rounded-2xl border border-border/60 p-4"
            >
              <div className="flex-1">
                <label
                  htmlFor={`toggle-${key}`}
                  className="cursor-pointer text-sm font-medium"
                >
                  {label}
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="shrink-0 pt-0.5">
                <Toggle
                  id={`toggle-${key}`}
                  checked={always || local[key as OptionalKey] === true}
                  disabled={always}
                  onChange={(v) =>
                    setLocal((prev) => ({ ...prev, [key as OptionalKey]: v }))
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={refuseAll}>
              Tout refuser
            </Button>
            <Button variant="outline" size="sm" onClick={acceptAll}>
              Tout accepter
            </Button>
          </div>
          <Button size="sm" onClick={() => savePreferences(local)}>
            Enregistrer mes choix
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Vous pouvez modifier vos préférences à tout moment depuis le pied de page.{" "}
          <Link
            href="/politique-confidentialite"
            className="underline transition-colors hover:text-foreground"
          >
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </Dialog>
  );
}
