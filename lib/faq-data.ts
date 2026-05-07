export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqGroup = {
  id: string;
  title: string;
  description?: string;
  items: FaqItem[];
};

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "offre",
    title: "L'offre Lumero",
    description:
      "Comprendre ce que vous obtenez avec un site Lumero et pourquoi c'est différent.",
    items: [
      {
        question: "Qu'est-ce que Lumero exactement ?",
        answer:
          "Lumero est une plateforme française Website-as-a-Service qui crée, héberge et maintient votre site vitrine professionnel. Vous choisissez un modèle conçu pour votre métier, vous répondez à un questionnaire guidé, et nous livrons un site optimisé SEO en moins de 24 heures ouvrées — clé en main, sans connaissance technique requise.",
      },
      {
        question: "Pourquoi choisir Lumero plutôt qu'un site WordPress ou Wix ?",
        answer:
          "Contrairement aux constructeurs de sites classiques, vous n'avez rien à configurer. Nos modèles sont conçus par des designers et ingénieurs spécialisés métier par métier, déjà optimisés pour Google (Core Web Vitals, données structurées, sitemap dynamique). Résultat : un site plus rapide, mieux référencé, et opérationnel en 24h au lieu de plusieurs semaines.",
      },
      {
        question: "Pour quels types d'activité Lumero est-il adapté ?",
        answer:
          "Lumero s'adresse aux artisans, restaurateurs, consultants, professions libérales, commerçants, coachs et TPE/PME qui ont besoin d'un site vitrine professionnel pour gagner en crédibilité et capter de nouveaux clients via Google. Chaque modèle est spécifiquement pensé pour un cœur de métier.",
      },
      {
        question: "Mon site sera-t-il vraiment unique ?",
        answer:
          "Oui. Même si nos modèles servent de base, chaque site est personnalisé : couleurs, contenus, photos, structure, ton éditorial. Deux clients d'un même secteur n'auront jamais le même rendu. Vous pouvez aussi demander des évolutions à tout moment depuis votre espace client.",
      },
    ],
  },
  {
    id: "delais-livraison",
    title: "Délais & livraison en 24h",
    items: [
      {
        question: "Comment Lumero peut-il livrer un site en 24 heures ?",
        answer:
          "Notre force, c'est l'industrialisation : modèles éprouvés, automatisation du déploiement, hébergement préconfiguré et équipe dédiée. Une fois votre questionnaire complété, votre projet entre directement en production. Le délai de 24h est compté en heures ouvrées et démarre à la validation de votre brief.",
      },
      {
        question: "Que se passe-t-il si je n'ai pas encore mon contenu prêt ?",
        answer:
          "Pas d'inquiétude : notre questionnaire vous guide pas à pas. Si vous manquez de textes, nous proposons une rédaction assistée optimisée SEO. Si vous manquez de visuels, nous intégrons des images professionnelles libres de droits adaptées à votre secteur, le temps que vous fournissiez les vôtres.",
      },
      {
        question: "Que comprend la livraison ?",
        answer:
          "Vous recevez un site en ligne, accessible via un nom de domaine (le vôtre ou un sous-domaine Lumero), avec hébergement, certificat SSL, formulaire de contact fonctionnel, sitemap, robots.txt, balises Open Graph et données structurées Schema.org. Tout est prêt à être indexé par Google dès la mise en ligne.",
      },
    ],
  },
  {
    id: "tarifs",
    title: "Tarifs & abonnements",
    items: [
      {
        question: "Combien coûte un site Lumero ?",
        answer:
          "Nos sites démarrent à 99€ en paiement unique pour un modèle prêt à l'emploi. Les formules sur mesure sont à 190€ (Start), 290€ (Standard) ou 490€ (Pro), en achat unique. Vous pouvez ajouter un abonnement optionnel Light (à partir de 9€/mois) pour l'hébergement et le domaine, ou Complet (à partir de 19€/mois) pour inclure mises à jour et support.",
      },
      {
        question: "Y a-t-il des frais cachés ?",
        answer:
          "Non. Le prix affiché est le prix payé. Pas de commission, pas de frais de mise en service surprise. Si vous choisissez l'achat unique sans abonnement, vous êtes propriétaire de votre site et libre de l'héberger où vous voulez.",
      },
      {
        question: "Puis-je résilier l'abonnement à tout moment ?",
        answer:
          "Oui. Les abonnements Lumero sont sans engagement et résiliables en un clic depuis votre espace client. Vous conservez votre site dans tous les cas — il vous appartient.",
      },
      {
        question: "L'abonnement est-il obligatoire ?",
        answer:
          "Non. L'achat unique sans abonnement vous donne un site complet, exporté et prêt à être hébergé chez n'importe quel fournisseur. L'abonnement n'est utile que si vous souhaitez nous confier l'hébergement, le domaine et la maintenance.",
      },
    ],
  },
  {
    id: "seo",
    title: "Référencement SEO & visibilité",
    items: [
      {
        question: "Mon site sera-t-il bien référencé sur Google ?",
        answer:
          "Le SEO est intégré par défaut dans chaque site Lumero : architecture sémantique HTML5, balises title et meta optimisées par page, sitemap.xml dynamique, robots.txt, données structurées Schema.org (LocalBusiness, Organization, FAQPage), Open Graph, performances Core Web Vitals au vert et compatibilité mobile native. Vous démarrez avec les fondamentaux techniques que la plupart des concurrents n'ont pas.",
      },
      {
        question: "Lumero garantit-il la première place sur Google ?",
        answer:
          "Aucun prestataire honnête ne peut garantir une position. En revanche, nous garantissons un socle technique impeccable et des contenus structurés pour maximiser vos chances. La position finale dépend de votre secteur, de la concurrence locale et de la qualité de vos contenus — sur lesquels nous vous accompagnons.",
      },
      {
        question: "Mon site est-il optimisé pour les IA et l'AEO ?",
        answer:
          "Oui. Nos sites intègrent des données structurées riches (FAQPage, HowTo, Article, LocalBusiness) qui permettent aux moteurs génératifs comme Google SGE, ChatGPT Search, Perplexity ou Bing Copilot de citer votre activité. Chaque page est rédigée avec des questions-réponses claires pour favoriser l'Answer Engine Optimization.",
      },
      {
        question: "Puis-je suivre les performances SEO de mon site ?",
        answer:
          "Oui. L'abonnement Complet inclut un tableau de bord de suivi (trafic, positions, vitesse, indexation). Nous installons Google Search Console et un outil d'analytique respectueux du RGPD dès la mise en ligne.",
      },
    ],
  },
  {
    id: "technique",
    title: "Aspects techniques",
    items: [
      {
        question: "Où est hébergé mon site ?",
        answer:
          "Sur une infrastructure européenne haute performance, conforme RGPD. Vos données ne quittent pas l'Union Européenne. Le certificat SSL est inclus et renouvelé automatiquement.",
      },
      {
        question: "Mon site est-il responsive et accessible ?",
        answer:
          "Oui. Tous les sites Lumero sont pensés mobile-first, testés sur tous les écrans, et respectent les bonnes pratiques d'accessibilité WCAG (contrastes, navigation clavier, lecteurs d'écran, balisage ARIA).",
      },
      {
        question: "Puis-je connecter mon propre nom de domaine ?",
        answer:
          "Bien sûr. Si vous avez déjà un domaine, nous le configurons gratuitement. Si vous n'en avez pas, nous l'offrons la première année avec les abonnements Light et Complet.",
      },
      {
        question: "Puis-je modifier mon site moi-même ?",
        answer:
          "Oui, depuis votre espace client vous pouvez demander des modifications de contenu, d'images, de couleurs ou ajouter de nouvelles pages. Avec l'abonnement Complet, les mises à jour sont illimitées.",
      },
    ],
  },
  {
    id: "support",
    title: "Support & accompagnement",
    items: [
      {
        question: "Quel support proposez-vous ?",
        answer:
          "Tous les clients bénéficient d'un support par e-mail. L'abonnement Light répond sous 72h ouvrées, l'abonnement Complet sous 48h. Pour les urgences, un canal prioritaire est disponible. Notre équipe est française et basée en Europe.",
      },
      {
        question: "Et si je ne suis pas satisfait du résultat ?",
        answer:
          "Nous travaillons en aller-retour : vous validez chaque étape avant la mise en ligne. Si après livraison le site ne correspond pas à vos attentes, nous procédons à des ajustements jusqu'à validation, sans surcoût.",
      },
      {
        question: "Comment commencer mon projet avec Lumero ?",
        answer:
          "Rendez-vous sur la page d'accueil, cliquez sur « Démarrer mon projet » et complétez le questionnaire en 5 à 10 minutes. Vous recevez ensuite un récapitulatif, validez votre commande, et votre site est en ligne sous 24 heures ouvrées.",
      },
    ],
  },
];

export const FAQ_FLAT: FaqItem[] = FAQ_GROUPS.flatMap((g) => g.items);
