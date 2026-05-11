import type { MetadataRoute } from "next";

const siteUrl = "https://lumero.fr";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/api/",
    "/admin/",
    "/portal/",
    "/account/",
    "/auth/",
    "/login",
    "/signup",
    "/reset-password",
  ];

  // Bots IA & moteurs de réponse — autorisés explicitement pour l'AEO
  // (Answer Engine Optimization). Indexation des pages publiques uniquement.
  const aiAndAnswerBots = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot",
    "Applebot-Extended",
    "Bingbot",
    "DuckDuckBot",
    "YandexBot",
    "Amazonbot",
    "Meta-ExternalAgent",
    "Meta-ExternalFetcher",
    "Bytespider",
    "Mistral-AI-User",
    "cohere-ai",
    "YouBot",
    "DeepSeekBot",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      ...aiAndAnswerBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: privatePaths,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
