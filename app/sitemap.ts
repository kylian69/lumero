import type { MetadataRoute } from "next";

const siteUrl = "https://lumero.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
