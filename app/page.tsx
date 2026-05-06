import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Gallery } from "@/components/sections/gallery";
import { Pricing } from "@/components/sections/pricing";
import { About } from "@/components/sections/about";
import { Questionnaire } from "@/components/sections/questionnaire";
import { Footer } from "@/components/sections/footer";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lumero",
    url: "https://lumero.fr",
    description:
      "Lumero est une plateforme Website-as-a-Service qui livre un site professionnel optimisé SEO en moins de 24 heures.",
    sameAs: [],
    offers: [
      {
        "@type": "Offer",
        name: "Modèle prêt à l'emploi",
        price: "99",
        priceCurrency: "EUR",
        description:
          "À partir de 99€ en paiement unique. Modèle pré-conçu par cœur de métier, livré en 48h.",
      },
      {
        "@type": "Offer",
        name: "Start",
        price: "190",
        priceCurrency: "EUR",
        description:
          "190€ en paiement unique. Abonnement optionnel : 9€/mois (Light) ou 19€/mois (Complet).",
      },
      {
        "@type": "Offer",
        name: "Standard",
        price: "290",
        priceCurrency: "EUR",
        description:
          "290€ en paiement unique. Abonnement optionnel : 14€/mois (Light) ou 29€/mois (Complet).",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "490",
        priceCurrency: "EUR",
        description:
          "490€ en paiement unique. Abonnement optionnel : 19€/mois (Light) ou 49€/mois (Complet).",
      },
    ],
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
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
