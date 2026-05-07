import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";
import { readLegalDoc } from "@/lib/legal-content";

const siteUrl = "https://lumero.fr";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Lumero",
  description:
    "Comment Lumero collecte, utilise et protège vos données personnelles, conformément au RGPD.",
  alternates: {
    canonical: "/politique-confidentialite",
    languages: {
      "fr-FR": "/politique-confidentialite",
      "en-US": "/privacy-policy",
    },
  },
  openGraph: {
    type: "article",
    url: `${siteUrl}/politique-confidentialite`,
    title: "Politique de confidentialité — Lumero",
    description:
      "Informations sur le traitement de vos données personnelles par Lumero (RGPD).",
  },
  robots: { index: true, follow: true },
};

export default function PolitiqueConfidentialitePage() {
  const content = readLegalDoc("politique-confidentialite.fr.md");
  return (
    <LegalPage
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Politique de confidentialité" },
      ]}
      content={content}
    />
  );
}
