export const CONSENT_STORAGE_KEY = "lumero_cookie_consent";
export const CONSENT_VERSION = "1.0";

export interface CookieConsent {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export type ConsentUpdate = Pick<CookieConsent, "preferences" | "analytics" | "marketing">;

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistConsent(update: ConsentUpdate): CookieConsent {
  const consent: CookieConsent = {
    necessary: true,
    ...update,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  return consent;
}
