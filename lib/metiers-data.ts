export type MetierLanding = {
  /** Segment d'URL complet, ex. "site-internet-restaurant" */
  slug: string;
  /** Libellé du métier, aligné sur les catégories de la galerie */
  label: string;
  /** Nom du modèle correspondant dans la galerie */
  template: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  pains: string[];
  benefits: { title: string; text: string }[];
  faq: { question: string; answer: string }[];
};

export const METIERS: MetierLanding[] = [
  {
    slug: "site-internet-restaurant",
    label: "Restaurateur",
    template: "Bistrot",
    title: "Création de site internet pour restaurant en 24h",
    description:
      "Site internet de restaurant livré en 24h : menu en ligne, réservation, photos, horaires, fiche Google optimisée. SEO local inclus, dès 99€.",
    h1: "Votre site de restaurant en ligne en 24h",
    intro:
      "Vos clients vous cherchent sur Google avant de réserver : menu, horaires, photos, avis. Lumero crée le site de votre restaurant en moins de 24 heures ouvrées — avec votre carte, vos plats en valeur et le référencement local pour apparaître quand on cherche « restaurant » près de chez vous.",
    pains: [
      "Votre carte n'est visible que sur les plateformes qui prennent des commissions.",
      "Vos horaires et votre menu changent, mais aucun support en ligne n'est à jour.",
      "Les clients ne trouvent que votre page Facebook ou des avis, jamais votre adresse officielle.",
    ],
    benefits: [
      {
        title: "Menu et carte toujours à jour",
        text: "Votre carte en ligne, modifiable sur simple demande depuis votre espace client : plats du jour, menus saisonniers, allergènes.",
      },
      {
        title: "SEO local intégré",
        text: "Données structurées Restaurant et LocalBusiness, lien avec votre fiche Google Business : vous ressortez sur les recherches « restaurant + votre ville ».",
      },
      {
        title: "Réservation et contact direct",
        text: "Bouton d'appel, formulaire de réservation ou lien vers votre module existant — sans commission d'intermédiaire.",
      },
      {
        title: "Photos qui donnent faim",
        text: "Mise en page conçue pour la restauration : vos plats et votre salle en pleine lumière, sur mobile comme sur ordinateur.",
      },
    ],
    faq: [
      {
        question: "Puis-je mettre mon menu à jour moi-même ?",
        answer:
          "Oui. Depuis votre espace client, vous demandez la mise à jour de votre carte (plats, prix, menus du jour) et elle est appliquée rapidement. Avec l'abonnement Complet, les mises à jour sont illimitées.",
      },
      {
        question: "Le site fonctionne-t-il avec ma fiche Google Business ?",
        answer:
          "Oui, et c'est même recommandé : nous relions votre site à votre fiche Google Business Profile, ce qui renforce votre visibilité locale et affiche vos horaires, photos et avis de façon cohérente.",
      },
      {
        question: "Puis-je intégrer un module de réservation ?",
        answer:
          "Oui. Nous intégrons un formulaire de réservation par e-mail, un bouton d'appel direct, ou un lien vers votre solution existante (TheFork, Zenchef, etc.).",
      },
      {
        question: "Combien coûte un site de restaurant avec Lumero ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Bistrot prêt à l'emploi, ou dès 190€ pour un site sur mesure. Hébergement et maintenance en option dès 9€/mois, sans engagement.",
      },
    ],
  },
  {
    slug: "site-internet-artisan",
    label: "Artisan",
    template: "Atelier",
    title: "Création de site internet pour artisan en 24h",
    description:
      "Site internet d'artisan livré en 24h : réalisations en photos, devis en ligne, zone d'intervention, SEO local. Plombier, électricien, menuisier… dès 99€.",
    h1: "Votre site d'artisan en ligne en 24h",
    intro:
      "Plombier, électricien, menuisier, peintre, maçon : vos futurs clients vous cherchent sur Google avec leur ville. Lumero crée votre site vitrine en moins de 24 heures ouvrées, avec vos réalisations en photos, votre zone d'intervention et un formulaire de demande de devis.",
    pains: [
      "Le bouche-à-oreille ne suffit plus : sans site, vous êtes invisible face aux concurrents référencés.",
      "Les plateformes de mise en relation prennent des commissions sur chaque chantier.",
      "Vous n'avez ni le temps ni l'envie de vous battre avec un éditeur de site.",
    ],
    benefits: [
      {
        title: "Vos réalisations en avant",
        text: "Galerie avant/après pensée pour les métiers du bâtiment : vos chantiers parlent pour vous.",
      },
      {
        title: "Demandes de devis qualifiées",
        text: "Formulaire de devis structuré (type de travaux, délai, localisation) qui arrive directement dans votre boîte mail.",
      },
      {
        title: "Visible dans votre zone",
        text: "Données structurées LocalBusiness et pages optimisées pour « votre métier + votre ville » : le SEO local est intégré dès le premier jour.",
      },
      {
        title: "Zéro maintenance pour vous",
        text: "Hébergement, sécurité, mises à jour : on s'occupe de tout pendant que vous êtes sur vos chantiers.",
      },
    ],
    faq: [
      {
        question: "Mon site peut-il cibler plusieurs villes d'intervention ?",
        answer:
          "Oui. Nous affichons clairement votre zone d'intervention et structurons le contenu pour le référencement local sur les communes que vous couvrez.",
      },
      {
        question: "Puis-je ajouter mes chantiers au fil du temps ?",
        answer:
          "Oui, votre galerie de réalisations évolue avec vous : envoyez vos photos depuis votre espace client et nous les intégrons, avec l'optimisation des images incluse.",
      },
      {
        question: "Je n'ai pas de logo ni de textes, c'est bloquant ?",
        answer:
          "Non. Notre questionnaire vous guide, nous proposons une rédaction assistée optimisée SEO et des visuels professionnels en attendant les vôtres.",
      },
      {
        question: "Combien coûte un site d'artisan avec Lumero ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Atelier, ou dès 190€ pour du sur-mesure. Abonnement optionnel dès 9€/mois pour l'hébergement et le domaine.",
      },
    ],
  },
  {
    slug: "site-internet-consultant",
    label: "Consultant",
    template: "Conseil",
    title: "Création de site internet pour consultant en 24h",
    description:
      "Site internet de consultant livré en 24h : offre claire, preuve d'expertise, prise de rendez-vous. Crédibilité professionnelle immédiate, dès 99€.",
    h1: "Votre site de consultant en ligne en 24h",
    intro:
      "Avant de signer, vos prospects vous googlent. Un profil LinkedIn ne suffit plus : un site professionnel pose votre crédibilité, clarifie votre offre et convertit vos visiteurs en rendez-vous. Lumero le met en ligne en moins de 24 heures ouvrées.",
    pains: [
      "Votre expertise est réelle, mais rien en ligne ne la prouve à un prospect pressé.",
      "Votre offre est expliquée différemment à chaque appel, faute de support de référence.",
      "Vous reportez la création de votre site depuis des mois par manque de temps.",
    ],
    benefits: [
      {
        title: "Positionnement clair",
        text: "Structure éprouvée : problème, méthode, offres, références. Votre proposition de valeur comprise en 10 secondes.",
      },
      {
        title: "Prise de rendez-vous intégrée",
        text: "Lien Calendly ou formulaire de contact qualifié : vos prospects réservent un créneau sans friction.",
      },
      {
        title: "Crédibilité immédiate",
        text: "Témoignages, logos clients, études de cas : les preuves sociales mises en scène au bon endroit.",
      },
      {
        title: "Trouvé sur votre spécialité",
        text: "Pages optimisées sur vos mots-clés d'expertise pour capter des prospects qui cherchent exactement ce que vous faites.",
      },
    ],
    faq: [
      {
        question: "Puis-je relier mon site à mon profil LinkedIn ?",
        answer:
          "Oui, et c'est conseillé : nous lions site et profils sociaux dans les deux sens, ce qui renforce votre marque personnelle et votre référencement de marque sur Google.",
      },
      {
        question: "Puis-je intégrer un agenda de prise de rendez-vous ?",
        answer:
          "Oui. Nous intégrons votre Calendly (ou équivalent) ou mettons en place un formulaire de contact qualifié qui arrive directement dans votre boîte mail.",
      },
      {
        question: "Puis-je publier des études de cas ou des articles ?",
        answer:
          "Oui. Votre site peut évoluer avec des pages d'études de cas ou un blog, leviers efficaces pour démontrer votre expertise et améliorer votre SEO.",
      },
      {
        question: "Combien coûte un site de consultant avec Lumero ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Conseil, ou dès 190€ pour un site sur mesure aligné sur votre positionnement.",
      },
    ],
  },
  {
    slug: "site-internet-avocat",
    label: "Avocat",
    template: "Cabinet",
    title: "Création de site internet pour avocat et cabinet en 24h",
    description:
      "Site internet d'avocat livré en 24h : domaines d'intervention, équipe, prise de contact confidentielle. Conforme à la déontologie, dès 99€.",
    h1: "Le site de votre cabinet d'avocat en 24h",
    intro:
      "Les justiciables choisissent leur avocat sur Google. Un site sobre et professionnel qui présente vos domaines d'intervention, votre équipe et vos modalités de contact fait la différence. Lumero le livre en moins de 24 heures ouvrées, dans le respect des règles déontologiques de la profession.",
    pains: [
      "Les annuaires d'avocats vous noient au milieu de dizaines de confrères.",
      "Votre cabinet n'a aucune vitrine reflétant son sérieux et ses spécialités.",
      "Vous craignez de communiquer sans respecter le cadre déontologique.",
    ],
    benefits: [
      {
        title: "Image rigoureuse et sobre",
        text: "Design pensé pour les professions juridiques : sérieux, lisibilité, hiérarchie claire des domaines d'intervention.",
      },
      {
        title: "Conforme à la déontologie",
        text: "Contenus rédigés dans le respect des règles de communication de la profession d'avocat (publicité personnelle encadrée).",
      },
      {
        title: "Contact confidentiel",
        text: "Formulaire sécurisé et mentions adaptées pour une première prise de contact en confiance.",
      },
      {
        title: "Référencement par spécialité",
        text: "Pages structurées par domaine (droit de la famille, droit du travail, droit pénal…) pour ressortir sur les recherches ciblées.",
      },
    ],
    faq: [
      {
        question: "Le site respecte-t-il la déontologie de la profession ?",
        answer:
          "Oui. Nous appliquons les règles de communication encadrant la publicité personnelle des avocats : contenus factuels, mentions obligatoires, sobriété des formulations.",
      },
      {
        question: "Peut-on présenter plusieurs associés et collaborateurs ?",
        answer:
          "Oui. Le modèle Cabinet prévoit une présentation de l'équipe avec les parcours, barreaux d'inscription et domaines de compétence de chacun.",
      },
      {
        question: "Les échanges via le formulaire sont-ils confidentiels ?",
        answer:
          "Le formulaire transite en HTTPS et les données sont traitées conformément au RGPD, hébergées en Union Européenne. Aucune donnée n'est partagée avec des tiers.",
      },
      {
        question: "Combien coûte un site d'avocat avec Lumero ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Cabinet, ou dès 190€ pour un site sur mesure adapté à votre cabinet.",
      },
    ],
  },
  {
    slug: "site-internet-sante",
    label: "Santé",
    template: "Clinique",
    title: "Création de site internet pour professionnel de santé en 24h",
    description:
      "Site internet de professionnel de santé livré en 24h : informations pratiques, accès, prise de rendez-vous, conformité RGPD. Dès 99€.",
    h1: "Votre site de professionnel de santé en 24h",
    intro:
      "Kinésithérapeute, ostéopathe, infirmier, dentiste, psychologue : vos patients cherchent vos horaires, votre adresse et un moyen de prendre rendez-vous. Lumero crée un site clair et rassurant en moins de 24 heures ouvrées, conforme au RGPD et hébergé en Europe.",
    pains: [
      "Vos patients ne trouvent que des plateformes tierces, jamais vos informations officielles.",
      "Votre activité évolue (horaires, congés, nouvelles consultations) sans support à jour.",
      "Vous voulez communiquer sans enfreindre les règles propres aux professions de santé.",
    ],
    benefits: [
      {
        title: "Informations pratiques claires",
        text: "Horaires, accès, parcours de soins, consignes avant consultation : tout ce que vos patients cherchent, trouvé en quelques secondes.",
      },
      {
        title: "Prise de rendez-vous facilitée",
        text: "Lien vers Doctolib ou votre solution de réservation, bouton d'appel direct sur mobile.",
      },
      {
        title: "RGPD et hébergement européen",
        text: "Données hébergées en Union Européenne, formulaires conformes, aucun traceur publicitaire imposé.",
      },
      {
        title: "Visibilité locale",
        text: "Données structurées adaptées aux professions médicales et SEO local pour les recherches « votre spécialité + votre ville ».",
      },
    ],
    faq: [
      {
        question: "Puis-je intégrer Doctolib ou ma solution de rendez-vous ?",
        answer:
          "Oui. Nous intégrons un lien ou un module de prise de rendez-vous vers Doctolib ou toute autre solution que vous utilisez déjà.",
      },
      {
        question: "Le site est-il conforme aux règles des professions de santé ?",
        answer:
          "Oui. Les contenus restent informatifs et factuels, conformément aux règles de communication des professions de santé réglementées.",
      },
      {
        question: "Où sont hébergées les données du site ?",
        answer:
          "Sur une infrastructure européenne conforme RGPD. Le formulaire de contact ne collecte que le minimum nécessaire et aucune donnée de santé n'est stockée sur le site.",
      },
      {
        question: "Combien coûte un site de professionnel de santé ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Clinique, ou dès 190€ pour un site sur mesure pour votre cabinet.",
      },
    ],
  },
  {
    slug: "site-internet-formation",
    label: "Formation",
    template: "Academy",
    title: "Création de site internet pour organisme de formation en 24h",
    description:
      "Site internet d'organisme de formation livré en 24h : catalogue, programmes, financement, inscriptions. Crédibilité Qualiopi, dès 99€.",
    h1: "Le site de votre organisme de formation en 24h",
    intro:
      "Financeurs, entreprises et apprenants vérifient votre sérieux en ligne avant de s'engager. Lumero crée le site de votre organisme de formation en moins de 24 heures ouvrées : catalogue clair, programmes détaillés, modalités de financement et formulaire d'inscription.",
    pains: [
      "Votre catalogue n'existe qu'en PDF, introuvable sur Google.",
      "Les exigences de transparence (programmes, tarifs, accessibilité) sont difficiles à publier proprement.",
      "Les inscriptions arrivent par des canaux dispersés, difficiles à suivre.",
    ],
    benefits: [
      {
        title: "Catalogue structuré",
        text: "Chaque formation a sa page : objectifs, programme, durée, prérequis, tarifs, modalités — le format attendu par les financeurs.",
      },
      {
        title: "Crédibilité renforcée",
        text: "Mise en avant de vos certifications (Qualiopi, certifications professionnelles) et de vos indicateurs de résultats.",
      },
      {
        title: "Inscriptions centralisées",
        text: "Formulaires de pré-inscription ou de demande de devis reliés à votre e-mail : un seul point d'entrée pour vos prospects.",
      },
      {
        title: "Trouvé par les bonnes recherches",
        text: "Pages optimisées par thématique de formation pour capter apprenants et entreprises sur Google.",
      },
    ],
    faq: [
      {
        question: "Puis-je présenter chaque formation sur une page dédiée ?",
        answer:
          "Oui. Chaque formation dispose de sa page structurée (objectifs, programme, public, prérequis, tarifs), bénéfique pour le SEO et conforme aux attentes des financeurs.",
      },
      {
        question: "Peut-on mettre en avant la certification Qualiopi ?",
        answer:
          "Oui, avec votre numéro de déclaration d'activité et vos certifications affichés aux emplacements appropriés, comme l'exige la réglementation.",
      },
      {
        question: "Le site peut-il évoluer quand mon catalogue change ?",
        answer:
          "Oui. Ajout de formations, mise à jour des dates de sessions et des tarifs : tout se demande depuis votre espace client.",
      },
      {
        question: "Combien coûte un site d'organisme de formation ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Academy, ou dès 190€ pour un site sur mesure avec votre catalogue complet.",
      },
    ],
  },
  {
    slug: "site-internet-coach",
    label: "Coach",
    template: "Mentor",
    title: "Création de site internet pour coach en 24h",
    description:
      "Site internet de coach livré en 24h : votre approche, vos offres, témoignages et réservation de séance. Marque personnelle forte, dès 99€.",
    h1: "Votre site de coach en ligne en 24h",
    intro:
      "Coach professionnel, sportif ou de vie : votre activité repose sur la confiance, et la confiance commence par votre présence en ligne. Lumero crée un site à votre image en moins de 24 heures ouvrées : votre approche, vos offres, vos témoignages et la réservation de séance.",
    pains: [
      "Votre activité dépend d'Instagram ou de LinkedIn, des audiences que vous ne possédez pas.",
      "Vos offres et tarifs ne sont posés nulle part, chaque prospect repart avec une version différente.",
      "Les sites « gratuits » que vous avez testés renvoient une image amateur.",
    ],
    benefits: [
      {
        title: "Votre marque personnelle",
        text: "Un site qui raconte votre parcours et votre méthode avec un design aligné sur votre personnalité.",
      },
      {
        title: "Offres lisibles",
        text: "Séance découverte, accompagnement individuel, programmes de groupe : vos formats et tarifs présentés clairement.",
      },
      {
        title: "Réservation sans friction",
        text: "Intégration Calendly ou formulaire de premier contact : vos prospects passent à l'action immédiatement.",
      },
      {
        title: "Témoignages qui convertissent",
        text: "Vos avis clients mis en scène au bon moment du parcours pour transformer la visite en prise de contact.",
      },
    ],
    faq: [
      {
        question: "Puis-je vendre des séances ou programmes en ligne ?",
        answer:
          "Le site présente vos offres et dirige vers la réservation ou le paiement (Calendly, Stripe, lien de paiement). Pour un parcours de vente complet, l'offre Pro est adaptée.",
      },
      {
        question: "Puis-je relier mon site à mes réseaux sociaux ?",
        answer:
          "Oui, dans les deux sens : vos réseaux alimentent le site et le site crédibilise vos profils. C'est aussi un signal positif pour votre référencement de marque.",
      },
      {
        question: "Et si mon positionnement évolue ?",
        answer:
          "Votre site évolue avec vous : changement d'offres, de cible ou de ton — les modifications se demandent depuis votre espace client.",
      },
      {
        question: "Combien coûte un site de coach avec Lumero ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Mentor, ou dès 190€ pour un site sur mesure fidèle à votre image.",
      },
    ],
  },
  {
    slug: "site-internet-photographe",
    label: "Photographe",
    template: "Lens",
    title: "Création de site internet pour photographe en 24h",
    description:
      "Site portfolio de photographe livré en 24h : galeries rapides et plein écran, prestations, tarifs, contact. Images optimisées, dès 99€.",
    h1: "Votre portfolio de photographe en ligne en 24h",
    intro:
      "Votre travail mérite mieux qu'un feed Instagram compressé. Lumero crée votre site portfolio en moins de 24 heures ouvrées : galeries plein écran, images optimisées sans perte visible, présentation de vos prestations et formulaire de demande de devis.",
    pains: [
      "Instagram compresse vos images et ne montre jamais vos séries comme vous l'entendez.",
      "Les portfolios en ligne génériques sont lents et pénalisés par Google.",
      "Vos demandes de devis se perdent entre messages privés et e-mails.",
    ],
    benefits: [
      {
        title: "Vos images, sans compromis",
        text: "Galeries plein écran avec images optimisées automatiquement : qualité visuelle maximale, temps de chargement minimal.",
      },
      {
        title: "Performance = référencement",
        text: "Core Web Vitals au vert malgré les visuels lourds : Google favorise les sites rapides, le vôtre en sera un.",
      },
      {
        title: "Prestations et tarifs clairs",
        text: "Mariage, portrait, corporate, immobilier : chaque prestation a son espace, ses exemples et sa grille tarifaire.",
      },
      {
        title: "Devis qualifiés",
        text: "Formulaire structuré (type de séance, date, lieu, budget) pour recevoir des demandes précises et y répondre vite.",
      },
    ],
    faq: [
      {
        question: "Mes photos seront-elles compressées ?",
        answer:
          "Vos images sont optimisées automatiquement (formats modernes, tailles adaptées à chaque écran) sans perte visible : le site reste rapide et vos photos impeccables.",
      },
      {
        question: "Puis-je organiser mes galeries par projet ou par thème ?",
        answer:
          "Oui. Galeries par série, par prestation ou par univers — la structure s'adapte à votre façon de présenter votre travail.",
      },
      {
        question: "Puis-je ajouter de nouvelles séries régulièrement ?",
        answer:
          "Oui, votre portfolio vit : envoyez vos nouvelles séries depuis votre espace client et nous les mettons en ligne, optimisation incluse.",
      },
      {
        question: "Combien coûte un site de photographe avec Lumero ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Lens, ou dès 190€ pour un portfolio sur mesure.",
      },
    ],
  },
  {
    slug: "site-internet-beaute",
    label: "Beauté",
    template: "Studio",
    title: "Création de site internet pour salon de beauté en 24h",
    description:
      "Site internet de salon de beauté ou coiffure livré en 24h : prestations, tarifs, réservation en ligne, photos. SEO local inclus, dès 99€.",
    h1: "Le site de votre salon de beauté en 24h",
    intro:
      "Coiffure, esthétique, onglerie, barbier : vos clientes cherchent vos prestations, vos tarifs et un créneau sur Google. Lumero crée le site de votre salon en moins de 24 heures ouvrées, avec la réservation en ligne et le référencement local pour remplir votre agenda.",
    pains: [
      "Votre visibilité dépend des plateformes de réservation et de leurs commissions.",
      "Vos tarifs et prestations ne sont publiés nulle part, on vous appelle pour tout.",
      "Votre univers et votre savoir-faire ne transparaissent pas en ligne.",
    ],
    benefits: [
      {
        title: "Carte des prestations et tarifs",
        text: "Vos soins, coupes et forfaits présentés clairement : moins d'appels pour demander les prix, plus de réservations directes.",
      },
      {
        title: "Réservation en ligne",
        text: "Intégration de Planity, Treatwell ou de votre solution : vos clientes réservent à toute heure, sans vous interrompre.",
      },
      {
        title: "Votre univers visuel",
        text: "Design élégant fidèle à l'ambiance de votre salon, avec vos réalisations en galerie.",
      },
      {
        title: "Remplir l'agenda via Google",
        text: "SEO local et lien avec votre fiche Google Business pour capter les recherches « coiffeur / institut + votre ville ».",
      },
    ],
    faq: [
      {
        question: "Puis-je intégrer Planity ou Treatwell ?",
        answer:
          "Oui. Nous intégrons un lien ou un module vers votre solution de réservation existante, ou un formulaire de demande de rendez-vous si vous n'en avez pas.",
      },
      {
        question: "Puis-je afficher mes tarifs et les modifier facilement ?",
        answer:
          "Oui. Votre grille tarifaire est présentée clairement et se met à jour sur simple demande depuis votre espace client.",
      },
      {
        question: "Le site m'aidera-t-il à être trouvée dans ma ville ?",
        answer:
          "Oui. Données structurées LocalBusiness, lien avec votre fiche Google Business et contenu optimisé pour les recherches locales font partie de la livraison.",
      },
      {
        question: "Combien coûte un site de salon de beauté ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Studio, ou dès 190€ pour un site sur mesure à l'image de votre salon.",
      },
    ],
  },
  {
    slug: "site-internet-immobilier",
    label: "Immobilier",
    template: "Domus",
    title: "Création de site internet pour agence immobilière en 24h",
    description:
      "Site internet d'agence immobilière livré en 24h : annonces, estimation, secteur, contact. Image professionnelle et SEO local, dès 99€.",
    h1: "Le site de votre agence immobilière en 24h",
    intro:
      "Vendeurs comme acquéreurs jugent une agence sur sa présence en ligne avant de pousser la porte. Lumero crée le site de votre agence ou de votre activité de mandataire en moins de 24 heures ouvrées : présentation de vos services, mise en avant de vos biens et demande d'estimation.",
    pains: [
      "Les portails d'annonces captent vos prospects et votre image de marque.",
      "Les vendeurs ne vous trouvent pas quand ils cherchent une agence sur leur secteur.",
      "Votre expertise locale n'est démontrée nulle part.",
    ],
    benefits: [
      {
        title: "Capter des mandats",
        text: "Formulaire de demande d'estimation en avant : le site travaille pour votre prospection vendeurs.",
      },
      {
        title: "Vos biens en valeur",
        text: "Présentation soignée de vos annonces avec photos optimisées, ou lien vers votre portail existant.",
      },
      {
        title: "Expertise de secteur",
        text: "Contenu structuré autour de votre zone : quartiers, tendances, conseils — ce qui vous positionne sur les recherches locales.",
      },
      {
        title: "Image premium",
        text: "Design sobre et professionnel qui inspire confiance aux vendeurs comme aux acquéreurs.",
      },
    ],
    faq: [
      {
        question: "Puis-je afficher mes annonces sur le site ?",
        answer:
          "Oui. Vos biens sont présentés sur le site avec photos et descriptifs, ou reliés à vos annonces sur les portails selon votre organisation.",
      },
      {
        question: "Le site peut-il générer des demandes d'estimation ?",
        answer:
          "Oui, c'est l'un des objectifs principaux du modèle Domus : un formulaire d'estimation visible incite les vendeurs de votre secteur à vous contacter.",
      },
      {
        question: "Comment être trouvé par les vendeurs de mon secteur ?",
        answer:
          "Grâce au SEO local : données structurées, contenu optimisé sur votre zone de chalandise et lien avec votre fiche Google Business.",
      },
      {
        question: "Combien coûte un site d'agence immobilière ?",
        answer:
          "À partir de 99€ en paiement unique avec le modèle Domus, ou dès 190€ pour un site sur mesure pour votre agence.",
      },
    ],
  },
];

export function getMetierBySlug(slug: string): MetierLanding | undefined {
  return METIERS.find((m) => m.slug === slug);
}
