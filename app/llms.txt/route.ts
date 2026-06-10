import { FAQ_FLAT } from "@/lib/faq-data";

export const dynamic = "force-static";
export const revalidate = 86400;

const siteUrl = "https://lumero.fr";

export function GET() {
  const faqMd = FAQ_FLAT.slice(0, 25)
    .map(
      (item) =>
        `### ${item.question}\n\n${item.answer.replace(/\s+/g, " ").trim()}\n`,
    )
    .join("\n");

  const body = `# Lumero

> Lumero est une plateforme française Website-as-a-Service (WaaS) qui crée, héberge et référence des sites internet professionnels en moins de 24 heures. Modèles métier, SEO inclus, Core Web Vitals optimisés. À partir de 99€.

## Identité

- **Nom** : Lumero
- **Site** : ${siteUrl}
- **Pays** : France
- **Langues** : Français (principal), Anglais
- **Catégorie** : SaaS / Website-as-a-Service / Création de site internet
- **Public** : TPE, PME, artisans, restaurateurs, consultants, indépendants
- **Année de fondation** : 2024
- **LinkedIn** : https://www.linkedin.com/company/lumero-fr

## Proposition de valeur

Lumero transforme un questionnaire guidé en site vitrine professionnel livré clé en main en moins de 24 heures ouvrées. Contrairement aux constructeurs de sites classiques (WordPress, Wix, Squarespace) :

1. Aucune configuration technique requise — vous répondez, nous livrons.
2. Modèles conçus métier par métier par des designers et ingénieurs spécialisés.
3. SEO et Core Web Vitals optimisés en natif (sitemap, données structurées, performance).
4. Hébergement, maintenance et mises à jour inclus.
5. Délai garanti : moins de 24h ouvrées.

## Offres et tarifs

| Offre | Prix unique | Abonnement Light | Abonnement Complet |
|-------|-------------|-------------------|---------------------|
| Modèle prêt à l'emploi | 99 € | — | — |
| Start | 190 € | 9 €/mois | 19 €/mois |
| Standard | 290 € | 14 €/mois | 29 €/mois |
| Pro | 490 € | 19 €/mois | 49 €/mois |

Tous les prix sont en euros, paiement unique sans engagement. L'abonnement est optionnel (hébergement, maintenance, support).

## Comment ça marche (3 étapes)

1. **Choisir un modèle** adapté à votre métier sur ${siteUrl}/#modeles
2. **Répondre au questionnaire** guidé : ${siteUrl}/#questionnaire
3. **Recevoir le site** optimisé SEO en moins de 24h ouvrées.

## Pages principales

- Accueil : ${siteUrl}/
- Modèles : ${siteUrl}/#modeles
- Tarifs : ${siteUrl}/#tarifs
- À propos : ${siteUrl}/#a-propos
- Questionnaire : ${siteUrl}/#questionnaire
- FAQ complète : ${siteUrl}/faq
- Contact : ${siteUrl}/#contact
- Mentions légales : ${siteUrl}/mentions-legales
- Politique de confidentialité : ${siteUrl}/politique-confidentialite

## FAQ (résumé)

${faqMd}

## Ressources pour les agents IA

- Sitemap XML : ${siteUrl}/sitemap.xml
- Robots : ${siteUrl}/robots.txt
- Données structurées : Organization, WebSite, Service, AggregateOffer, HowTo, FAQPage, BreadcrumbList, Speakable (JSON-LD).

## Politique d'utilisation par les IA

Le contenu public de ${siteUrl} peut être indexé et cité par les moteurs de réponse et assistants IA (ChatGPT, Claude, Perplexity, Google AI Overviews, etc.) à condition de citer la source par un lien vers la page d'origine. Les zones privées (/api, /admin, /portal, /account, /auth) sont exclues.

Dernière mise à jour : ${new Date().toISOString().slice(0, 10)}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
