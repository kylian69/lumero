import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { METIERS, getMetierBySlug } from "@/lib/metiers-data";

const siteUrl = "https://lumero.fr";

export const dynamicParams = false;

export function generateStaticParams() {
  return METIERS.map((m) => ({ metier: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metier: string }>;
}): Promise<Metadata> {
  const { metier } = await params;
  const data = getMetierBySlug(metier);
  if (!data) return {};

  const pageUrl = `${siteUrl}/${data.slug}`;

  return {
    title: data.title,
    description: data.description,
    alternates: {
      canonical: `/${data.slug}`,
      languages: { "fr-FR": `/${data.slug}`, "x-default": `/${data.slug}` },
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: `${data.title} · Lumero`,
      description: data.description,
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
    },
  };
}

export default async function MetierLandingPage({
  params,
}: {
  params: Promise<{ metier: string }>;
}) {
  const { metier } = await params;
  const data = getMetierBySlug(metier);
  if (!data) notFound();

  const pageUrl = `${siteUrl}/${data.slug}`;
  const otherMetiers = METIERS.filter((m) => m.slug !== data.slug);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    serviceType: data.title,
    name: data.title,
    description: data.description,
    url: pageUrl,
    provider: { "@id": `${siteUrl}#organization` },
    areaServed: { "@type": "Country", name: "France" },
    audience: { "@type": "BusinessAudience", audienceType: data.label },
    offers: {
      "@type": "Offer",
      price: "99",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/#tarifs`,
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: data.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: data.title, item: pageUrl },
    ],
  };

  return (
    <>
      <Navbar />
      <main id="main" className="pt-24">
        <section
          aria-labelledby="metier-title"
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
                <li className="text-foreground">{data.label}</li>
              </ol>
            </nav>
            <p className="mt-6 text-sm font-medium text-primary">
              Site internet {data.label}
            </p>
            <h1
              id="metier-title"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl"
            >
              {data.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {data.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/#questionnaire">Démarrer mon projet</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#modeles">Voir le modèle {data.template}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="metier-pains-title" className="py-16">
          <div className="container max-w-4xl">
            <h2
              id="metier-pains-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Vous vous reconnaissez ?
            </h2>
            <ul className="mt-6 space-y-4">
              {data.pains.map((pain) => (
                <li
                  key={pain}
                  className="rounded-lg border border-border/60 bg-card p-4 text-muted-foreground"
                >
                  {pain}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="metier-benefits-title"
          className="py-16 bg-gradient-to-b from-transparent via-muted/30 to-transparent"
        >
          <div className="container max-w-4xl">
            <h2
              id="metier-benefits-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Ce que Lumero apporte à votre activité
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {data.benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-lg border border-border/60 bg-card p-6"
                >
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {benefit.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="metier-faq-title" className="py-16">
          <div className="container max-w-4xl">
            <h2
              id="metier-faq-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Questions fréquentes — {data.label}
            </h2>
            <div className="mt-8 space-y-8">
              {data.faq.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-2 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-muted-foreground">
              D&apos;autres questions ?{" "}
              <Link
                href="/faq"
                className="text-primary underline-offset-4 hover:underline"
              >
                Consultez la FAQ complète
              </Link>
              .
            </p>
          </div>
        </section>

        <section
          aria-labelledby="metier-cta-title"
          className="py-20 border-t border-border/60 bg-gradient-to-b from-muted/30 to-transparent"
        >
          <div className="container max-w-3xl text-center">
            <h2
              id="metier-cta-title"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Votre site {data.label.toLowerCase()} en ligne demain
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground sm:text-lg">
              Répondez au questionnaire en 5 à 10 minutes : votre site est livré
              en moins de 24 heures ouvrées, SEO et hébergement inclus, à partir
              de 99€ sans engagement.
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

        <section aria-labelledby="metier-others-title" className="py-16">
          <div className="container max-w-4xl">
            <h2
              id="metier-others-title"
              className="text-xl font-semibold tracking-tight"
            >
              Lumero pour les autres métiers
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {otherMetiers.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/${m.slug}`}
                    className="inline-block rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
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
