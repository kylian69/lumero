import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/session-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = "https://lume.studio";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lume — Votre site professionnel, déployé en 24h",
    template: "%s · Lume",
  },
  description:
    "Lume est la plateforme Website-as-a-Service qui livre un site professionnel, optimisé SEO et prêt à convertir en moins de 24 heures. Choisissez un modèle, répondez au questionnaire, brillez.",
  applicationName: "Lume",
  keywords: [
    "site internet",
    "website as a service",
    "création de site",
    "site vitrine",
    "SEO",
    "Next.js",
    "24h",
    "artisan",
    "restaurateur",
    "consultant",
  ],
  authors: [{ name: "Lume" }],
  creator: "Lume",
  publisher: "Lume",
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    title: "Lume — Votre site professionnel, déployé en 24h",
    description:
      "Choisissez un modèle, répondez au questionnaire, recevez un site optimisé SEO en moins de 24h.",
    siteName: "Lume",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Lume — Website as a Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lume — Votre site professionnel, déployé en 24h",
    description:
      "La plateforme WaaS qui transforme un questionnaire en site professionnel optimisé SEO.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
