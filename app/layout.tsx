import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/session-provider";
import { CookieConsentProvider } from "@/components/cookie-consent/provider";
import { CookieBanner } from "@/components/cookie-consent/banner";
import { CookiePreferencesModal } from "@/components/cookie-consent/preferences-modal";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = "https://lumero.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "Lumero — Création de site internet professionnel en 24h | Website-as-a-Service",
    template: "%s · Lumero",
  },
  description:
    "Lumero crée, héberge et référence votre site internet professionnel en moins de 24 heures. Plateforme française Website-as-a-Service, modèles métier, SEO inclus, Core Web Vitals optimisés. À partir de 99€.",
  applicationName: "Lumero",
  category: "Business Services",
  keywords: [
    "création de site internet",
    "création site web 24h",
    "site internet professionnel",
    "website as a service",
    "WaaS France",
    "site vitrine pas cher",
    "site internet artisan",
    "site internet restaurant",
    "site internet consultant",
    "création site clé en main",
    "agence web France",
    "SEO inclus",
    "référencement Google",
    "Core Web Vitals",
    "Next.js site rapide",
    "Lumero",
  ],
  authors: [{ name: "Lumero", url: siteUrl }],
  creator: "Lumero",
  publisher: "Lumero",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    title:
      "Lumero — Création de site internet professionnel en 24h | Website-as-a-Service",
    description:
      "Plateforme française Website-as-a-Service. Site professionnel optimisé SEO, hébergé et livré en moins de 24 heures. À partir de 99€.",
    siteName: "Lumero",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Lumero — Création de site internet professionnel en 24h",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lumerofr",
    creator: "@lumerofr",
    title: "Lumero — Site professionnel en 24h | Website-as-a-Service",
    description:
      "Plateforme française WaaS : site optimisé SEO, hébergé et livré en moins de 24 heures. À partir de 99€.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    // Ajoutez ici vos jetons de vérification (Search Console, Bing, etc.)
    // google: "xxxxxxxx",
    // other: { "msvalidate.01": "xxxxxxxx" },
  },
  other: {
    "theme-color": "#ffffff",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050816" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: "Lumero",
    alternateName: ["Lumero.fr", "Lumero WaaS"],
    description:
      "Plateforme française Website-as-a-Service : création, hébergement et référencement de sites professionnels en moins de 24 heures.",
    inLanguage: "fr-FR",
    publisher: { "@id": `${siteUrl}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/faq?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="fr-FR" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="font-sans min-h-screen bg-background text-foreground">
        <CookieConsentProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthSessionProvider>{children}</AuthSessionProvider>
            <Toaster position="top-right" richColors />
            <CookieBanner />
            <CookiePreferencesModal />
          </ThemeProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
