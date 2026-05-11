"use client";

import { useCookieConsent } from "./provider";

export function ManageCookiesLink() {
  const { openPreferences } = useCookieConsent();

  return (
    <li>
      <button
        type="button"
        onClick={openPreferences}
        className="hover:text-foreground"
      >
        Gérer les cookies
      </button>
    </li>
  );
}
