import type { MetadataRoute } from "next";
import { METIERS } from "@/lib/metiers-data";

const siteUrl = "https://lumero.fr";

// Date de dernière modification réelle du contenu — à mettre à jour
// lors des évolutions significatives des pages concernées.
const lastContentUpdate = new Date("2026-06-10");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = lastContentUpdate;

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "fr-FR": `${siteUrl}/`,
          "x-default": `${siteUrl}/`,
        },
      },
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...METIERS.map((m) => ({
      url: `${siteUrl}/${m.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: {
        languages: {
          "fr-FR": `${siteUrl}/mentions-legales`,
          "en-US": `${siteUrl}/legal-notice`,
        },
      },
    },
    {
      url: `${siteUrl}/legal-notice`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/politique-confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: {
        languages: {
          "fr-FR": `${siteUrl}/politique-confidentialite`,
          "en-US": `${siteUrl}/privacy-policy`,
        },
      },
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
