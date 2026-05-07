import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";
import { readLegalDoc } from "@/lib/legal-content";

const siteUrl = "https://lumero.fr";

export const metadata: Metadata = {
  title: "Privacy Policy — Lumero",
  description:
    "How Lumero collects, uses and protects your personal data, in accordance with the GDPR.",
  alternates: {
    canonical: "/privacy-policy",
    languages: {
      "fr-FR": "/politique-confidentialite",
      "en-US": "/privacy-policy",
    },
  },
  openGraph: {
    type: "article",
    url: `${siteUrl}/privacy-policy`,
    title: "Privacy Policy — Lumero",
    description: "Information about how Lumero processes your personal data (GDPR).",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  const content = readLegalDoc("politique-confidentialite.en.md");
  return (
    <LegalPage
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Privacy Policy" },
      ]}
      content={content}
    />
  );
}
