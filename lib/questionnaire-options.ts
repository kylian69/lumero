export const OBJECTIF_OPTIONS: Record<string, { label: string; description: string }> = {
  rdv: {
    label: "Prise de rendez-vous",
    description: "Laisser mes clients réserver en ligne.",
  },
  vente: {
    label: "Vente en ligne",
    description: "Vendre des produits ou services directement.",
  },
  vitrine: {
    label: "Vitrine",
    description: "Présenter mon activité et gagner en crédibilité.",
  },
  leads: {
    label: "Génération de leads",
    description: "Collecter des prospects qualifiés.",
  },
  recrutement: {
    label: "Recrutement",
    description: "Attirer des candidats et présenter l'équipe.",
  },
  communaute: {
    label: "Informer / Communauté",
    description: "Fédérer autour de mon contenu.",
  },
};

export const FONCTIONNALITE_OPTIONS: Record<string, { label: string; description: string }> = {
  rdv: {
    label: "Prise de RDV",
    description: "Permettre aux clients de réserver un créneau directement depuis le site.",
  },
  paiement: {
    label: "Paiement en ligne",
    description: "Encaisser des paiements sécurisés (CB, Apple Pay, etc.).",
  },
  blog: {
    label: "Blog",
    description: "Publier des articles pour informer et améliorer le référencement.",
  },
  galerie: {
    label: "Galerie photos",
    description: "Mettre en valeur des réalisations ou produits en images.",
  },
  temoignages: {
    label: "Témoignages",
    description: "Afficher des avis clients pour rassurer les visiteurs.",
  },
  newsletter: {
    label: "Newsletter",
    description: "Collecter des emails et envoyer des campagnes.",
  },
  multilingue: {
    label: "Multilingue",
    description: "Proposer le site en plusieurs langues.",
  },
  devis: {
    label: "Formulaire de devis",
    description: "Recevoir des demandes de devis qualifiées.",
  },
  carte: {
    label: "Carte / itinéraire",
    description: "Afficher l'adresse et l'itinéraire vers le lieu d'activité.",
  },
  membres: {
    label: "Espace membres",
    description: "Zone privée accessible après connexion.",
  },
  chat: {
    label: "Chat en ligne",
    description: "Discuter en direct avec les visiteurs du site.",
  },
  catalogue: {
    label: "Catalogue produits",
    description: "Présenter une liste de produits ou services détaillés.",
  },
};

export function getObjectifDetails(id: string) {
  return OBJECTIF_OPTIONS[id] ?? { label: id, description: "" };
}

export function getFonctionnaliteDetails(id: string) {
  return FONCTIONNALITE_OPTIONS[id] ?? { label: id, description: "" };
}
