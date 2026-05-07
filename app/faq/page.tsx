import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/sections/faq";
import { FAQ_GROUPS, FAQ_FLAT } from "@/lib/faq-data";

const siteUrl = "https://lumero.fr";
const pageUrl = `${siteUrl}/faq`;

export const metadata: Metadata = {
  title: "FAQ — Toutes les réponses sur la création de votre site en 24h",
  description:
    "Délais, tarifs, SEO, hébergement, abonnement : retrouvez toutes les réponses aux questions fréquentes sur Lumero, la solution Website-as-a-Service qui livre un site professionnel en moins de 24 heures.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "article",
    url: pageUrl,
    title: "FAQ Lumero — Site professionnel en 24h, SEO inclus",
    description:
      "Toutes les réponses sur la création, le SEO, les tarifs et l'hébergement de votre site Lumero.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ Lumero — Site professionnel en 24h",
    description:
      "Tarifs, délais, SEO, hébergement : les réponses aux questions les plus fréquentes.",
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_FLAT.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
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
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Navbar />
      <main id="main" className="pt-24">
        <section
          aria-labelledby="faq-title"
          className="py-16 sm:py-24 bg-gradient-to-b from-transparent via-muted/30 to-transparent"
        >
          <div className="container max-w-4xl">
            <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-foreground">
                    Accueil
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-foreground">FAQ</li>
              </ol>
            </nav>
            <p className="mt-6 text-sm font-medium text-primary">
              Foire aux questions
            </p>
            <h1
              id="faq-title"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl"
            >
              Tout ce qu'il faut savoir avant de lancer votre site
            </h1>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Délais, tarifs, référencement, hébergement, support : nos réponses
              les plus complètes pour vous aider à choisir Lumero en toute
              confiance. Une question manque ?{" "}
              <a href="#contact-faq" className="text-primary underline-offset-4 hover:underline">
                Contactez-nous
              </a>
              , nous répondons en moins de 24h.
            </p>

            <nav
              aria-label="Catégories de questions"
              className="mt-10 flex flex-wrap gap-2"
            >
              {FAQ_GROUPS.map((g) => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  className="rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {g.title}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section className="pb-24">
          <div className="container max-w-4xl space-y-14">
            {FAQ_GROUPS.map((group) => (
              <div key={group.id} id={group.id} className="scroll-mt-24">
                <header className="mb-5">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {group.title}
                  </h2>
                  {group.description ? (
                    <p className="mt-2 text-muted-foreground">
                      {group.description}
                    </p>
                  ) : null}
                </header>
                <FaqAccordion items={group.items} />
              </div>
            ))}
          </div>
        </section>

        <section
          id="contact-faq"
          aria-labelledby="faq-cta-title"
          className="py-20 border-t border-border/60 bg-gradient-to-b from-muted/30 to-transparent"
        >
          <div className="container max-w-3xl text-center">
            <h2
              id="faq-cta-title"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Prêt à lancer votre site en 24h ?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground sm:text-lg">
              Plus de 200 entrepreneurs ont déjà fait confiance à Lumero pour
              donner vie à leur présence en ligne. Démarrez votre projet en
              quelques minutes — sans engagement, sans connaissance technique.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/#questionnaire">Démarrer mon projet</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#tarifs">Voir les tarifs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
