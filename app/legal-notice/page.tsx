import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";
import { readLegalDoc } from "@/lib/legal-content";

const siteUrl = "https://lumero.fr";

export const metadata: Metadata = {
  title: "Legal Notice — Lumero",
  description:
    "Legal notice for the Lumero website and application: publisher, hosting provider, intellectual property and terms of use.",
  alternates: {
    canonical: "/legal-notice",
    languages: {
      "fr-FR": "/mentions-legales",
      "en-US": "/legal-notice",
    },
  },
  openGraph: {
    type: "article",
    url: `${siteUrl}/legal-notice`,
    title: "Legal Notice — Lumero",
    description: "Legal information about the publisher of Lumero.",
  },
  robots: { index: true, follow: true },
};

export default function LegalNoticePage() {
  const content = readLegalDoc("mentions-legales.en.md");
  return (
    <LegalPage
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Legal Notice" },
      ]}
      content={content}
    />
  );
}
