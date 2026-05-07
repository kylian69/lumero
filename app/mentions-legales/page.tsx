import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";
import { readLegalDoc } from "@/lib/legal-content";

const siteUrl = "https://lumero.fr";

export const metadata: Metadata = {
  title: "Mentions légales — Lumero",
  description:
    "Mentions légales du site et de l'application Lumero : éditeur, hébergeur, propriété intellectuelle et conditions d'utilisation.",
  alternates: {
    canonical: "/mentions-legales",
    languages: {
      "fr-FR": "/mentions-legales",
      "en-US": "/legal-notice",
    },
  },
  openGraph: {
    type: "article",
    url: `${siteUrl}/mentions-legales`,
    title: "Mentions légales — Lumero",
    description: "Informations légales relatives à l'éditeur de Lumero.",
  },
  robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
  const content = readLegalDoc("mentions-legales.fr.md");
  return (
    <LegalPage
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Mentions légales" },
      ]}
      content={content}
    />
  );
}
