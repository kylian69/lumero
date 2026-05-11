"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  CookieConsent,
  ConsentUpdate,
  getStoredConsent,
  persistConsent,
} from "@/lib/cookie-consent";

interface CookieConsentContextValue {
  consent: CookieConsent | null;
  hasDecided: boolean;
  bannerVisible: boolean;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  refuseAll: () => void;
  savePreferences: (update: ConsentUpdate) => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hasDecided, setHasDecided] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
      setHasDecided(true);
    } else {
      setBannerVisible(true);
    }
  }, []);

  const finalize = useCallback((update: ConsentUpdate) => {
    const c = persistConsent(update);
    setConsent(c);
    setHasDecided(true);
    setBannerVisible(false);
    setPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(
    () => finalize({ preferences: true, analytics: true, marketing: true }),
    [finalize]
  );

  const refuseAll = useCallback(
    () => finalize({ preferences: false, analytics: false, marketing: false }),
    [finalize]
  );

  const savePreferences = useCallback(
    (update: ConsentUpdate) => finalize(update),
    [finalize]
  );

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasDecided,
        bannerVisible,
        preferencesOpen,
        openPreferences: () => setPreferencesOpen(true),
        closePreferences: () => setPreferencesOpen(false),
        acceptAll,
        refuseAll,
        savePreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
