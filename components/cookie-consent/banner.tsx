"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "./provider";

export function CookieBanner() {
  const { bannerVisible, acceptAll, refuseAll, openPreferences } = useCookieConsent();

  return (
    <AnimatePresence>
      {bannerVisible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm"
          role="region"
          aria-label="Consentement aux cookies"
        >
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold">Nous utilisons des cookies</p>
                <p className="mt-0.5 max-w-prose text-xs text-muted-foreground">
                  Certains cookies sont nécessaires au fonctionnement du site. D&apos;autres nous
                  aident à améliorer votre expérience et à analyser notre audience.{" "}
                  <Link
                    href="/politique-confidentialite"
                    className="underline transition-colors hover:text-foreground"
                  >
                    En savoir plus
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={refuseAll}>
                Refuser
              </Button>
              <Button variant="outline" size="sm" onClick={openPreferences}>
                Personnaliser
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Tout accepter
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
