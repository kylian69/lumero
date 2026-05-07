import type { MetadataRoute } from "next";

const siteUrl = "https://lumero.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["", "faq", "#modeles", "#tarifs", "#a-propos", "#questionnaire"];
  return paths.map((path) => ({
    url: `${siteUrl}/${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
