import type { Metadata } from "next";
import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Gallery } from "@/components/sections/gallery";
import { Pricing } from "@/components/sections/pricing";
import { About } from "@/components/sections/about";
import { Questionnaire } from "@/components/sections/questionnaire";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";

const siteUrl = "https://lumero.fr";

export const metadata: Metadata = {
  title:
    "Lumero — Création de site internet professionnel en 24h | Website-as-a-Service",
  description:
    "Lumero crée, héberge et référence votre site internet professionnel en moins de 24 heures. Modèles métier, SEO inclus, Core Web Vitals optimisés. À partir de 99€.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: "Lumero",
    legalName: "Lumero",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/og.png`,
      width: 1200,
      height: 630,
    },
    image: `${siteUrl}/og.png`,
    description:
      "Plateforme française Website-as-a-Service : création, hébergement et référencement de sites internet professionnels en moins de 24 heures.",
    foundingDate: "2024",
    areaServed: { "@type": "Country", name: "France" },
    knowsLanguage: ["fr-FR"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["French", "English"],
        areaServed: "FR",
        url: `${siteUrl}/#contact`,
      },
    ],
    sameAs: ["https://www.linkedin.com/company/lumero-fr"],
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}#service`,
    serviceType: "Création de site internet (Website-as-a-Service)",
    name: "Création de site internet professionnel en 24h",
    provider: { "@id": `${siteUrl}#organization` },
    areaServed: { "@type": "Country", name: "France" },
    description:
      "Création, hébergement, maintenance et référencement SEO de sites vitrines professionnels livrés en moins de 24 heures.",
    audience: {
      "@type": "BusinessAudience",
      audienceType: "TPE, PME, artisans, restaurateurs, consultants",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "99",
      highPrice: "490",
      offerCount: 4,
      offers: [
        {
          "@type": "Offer",
          name: "Modèle prêt à l'emploi",
          price: "99",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/#tarifs`,
          description:
            "Modèle pré-conçu par cœur de métier, livré en 48h. Paiement unique.",
        },
        {
          "@type": "Offer",
          name: "Start",
          price: "190",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/#tarifs`,
          description:
            "Site sur-mesure d'entrée de gamme. 190€ paiement unique. Abonnement optionnel 9€/mois (Light) ou 19€/mois (Complet).",
        },
        {
          "@type": "Offer",
          name: "Standard",
          price: "290",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/#tarifs`,
          description:
            "Site sur-mesure standard. 290€ paiement unique. Abonnement optionnel 14€/mois (Light) ou 29€/mois (Complet).",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "490",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/#tarifs`,
          description:
            "Site sur-mesure premium. 490€ paiement unique. Abonnement optionnel 19€/mois (Light) ou 49€/mois (Complet).",
        },
      ],
    },
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Comment obtenir un site internet professionnel en 24h avec Lumero",
    description:
      "Trois étapes simples pour lancer votre site professionnel en moins de 24 heures.",
    totalTime: "PT24H",
    estimatedCost: { "@type": "MonetaryAmount", currency: "EUR", value: "99" },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Choisissez un modèle adapté à votre métier",
        text: "Sélectionnez un modèle pré-optimisé conçu par des designers spécialisés métier par métier.",
        url: `${siteUrl}/#modeles`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Répondez au questionnaire guidé",
        text: "Renseignez vos informations, votre identité visuelle et vos contenus via un questionnaire intelligent.",
        url: `${siteUrl}/#questionnaire`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Recevez votre site optimisé SEO",
        text: "Votre site est conçu, optimisé Core Web Vitals, hébergé et mis en ligne en moins de 24 heures.",
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: siteUrl,
      },
    ],
  };

  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}#webpage`,
    url: siteUrl,
    name: "Lumero — Création de site internet professionnel en 24h",
    isPartOf: { "@id": `${siteUrl}#website` },
    about: { "@id": `${siteUrl}#organization` },
    primaryImageOfPage: { "@type": "ImageObject", url: `${siteUrl}/og.png` },
    inLanguage: "fr-FR",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#hero-title", "#main h2", "#main p"],
    },
  };

  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Gallery />
        <Pricing />
        <About />
        <Questionnaire />
        <Contact />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
      />
    </>
  );
}
