# Politique de confidentialité

**Date d'entrée en vigueur :** 7 mai 2026
**Dernière mise à jour :** 7 mai 2026

La présente politique de confidentialité décrit la manière dont Kylian GALLOT (entrepreneur individuel, SIREN 919 325 530), en qualité de responsable de traitement, collecte, utilise et protège les données personnelles des utilisateurs du site et de l'application Lumero (ci-après « Lumero »), conformément au Règlement (UE) 2016/679 (« RGPD ») et à la loi n° 78-17 du 6 janvier 1978 modifiée (« Loi Informatique et Libertés »).

## 1. Responsable de traitement

- **Responsable :** Kylian GALLOT — Entrepreneur individuel
- **Adresse :** 39 Rue du Chater, 69530 Orliénas, France
- **Email :** kylian.gallot@icloud.com
- **Téléphone :** +33 6 13 24 15 19

Lumero ne dispose pas d'un Délégué à la protection des données (DPO), la désignation n'étant pas obligatoire au regard de l'activité.

## 2. Données collectées

Lumero ne collecte que les données strictement nécessaires aux finalités décrites ci-dessous.

### 2.1 Données fournies directement par l'utilisateur

**Lors d'une demande de contact, d'un devis ou du questionnaire de création de site :**
- Nom de l'entreprise, nom du contact, email, téléphone
- Domaine d'activité, objectifs du site, préférences de style, inspirations
- Logo (image téléversée), couleur principale, fonctionnalités souhaitées
- Présences en ligne existantes (site actuel, Google Business, Instagram, Facebook, LinkedIn)
- Message libre

**Lors de la création d'un compte client (portail) :**
- Email, prénom, nom, téléphone
- Mot de passe (stocké sous forme de hash bcrypt — jamais en clair)
- Avatar (photo de profil, optionnel)
- Le cas échéant, secret d'authentification à deux facteurs (TOTP)

**Lors de l'utilisation du portail client :**
- Tickets de support : sujet, contenu, pièces jointes, priorité, catégorie
- Demandes de personnalisation : titre, description, pièces jointes
- Informations relatives à votre projet et à votre abonnement

### 2.2 Données générées par l'utilisation

- Journaux d'activité (audit log) : actions effectuées dans l'interface, horodatages
- Données techniques : adresse IP, user-agent, dates de connexion (à des fins de sécurité)
- Cookie de session d'authentification (NextAuth, JWT, durée 30 jours)
- Cookie de préférence de thème (clair / sombre)

### 2.3 Données que nous **ne collectons pas**

Lumero ne collecte **pas** : données de localisation précise, données de santé, **données de carte bancaire** (les paiements en ligne sont traités par notre prestataire Stripe, certifié PCI-DSS : aucune coordonnée bancaire ne transite ni n'est stockée sur les serveurs de Lumero — nous ne conservons qu'un identifiant de transaction et le statut du paiement), données relatives à des mineurs (le service n'est pas destiné aux personnes de moins de 18 ans).

Aucune donnée n'est utilisée pour de la publicité ciblée, du profilage automatisé, ou transmise à des courtiers de données.

## 3. Finalités et bases légales

| Finalité | Base légale (RGPD) |
|---|---|
| Répondre aux demandes de contact, devis, questionnaire | Mesures précontractuelles (art. 6.1.b) |
| Création et gestion du compte client | Exécution du contrat (art. 6.1.b) |
| Fourniture du service Lumero (création, hébergement et maintenance du site client) | Exécution du contrat (art. 6.1.b) |
| Gestion du support et des demandes de personnalisation | Exécution du contrat (art. 6.1.b) |
| Envoi d'emails transactionnels (confirmation, invitation, réinitialisation, notifications) | Exécution du contrat (art. 6.1.b) |
| Sécurité de la plateforme, prévention des abus, journaux d'audit | Intérêt légitime (art. 6.1.f) |
| Respect des obligations légales (facturation, comptabilité, réquisitions) | Obligation légale (art. 6.1.c) |

Aucune communication marketing automatisée n'est envoyée sans consentement préalable.

## 4. Destinataires et sous-traitants

Vos données ne sont accessibles qu'aux personnes habilitées chez Lumero (l'éditeur et, le cas échéant, les membres de son équipe). Elles peuvent être traitées par les sous-traitants suivants, agissant sur instructions documentées et présentant des garanties appropriées :

| Sous-traitant | Rôle | Données concernées | Localisation |
|---|---|---|---|
| **Brevo** (Sendinblue SAS) | Envoi d'emails transactionnels | Email destinataire, contenu de l'email, pièces jointes éventuelles | Union européenne (France) |
| **Stripe** (Stripe Payments Europe Ltd) | Traitement des paiements en ligne et émission des factures | Nom, email, montant, identifiants de transaction et de carte (collectés et conservés directement par Stripe, jamais par Lumero) | Irlande (UE) / États-Unis — Clauses contractuelles types |
| **GitHub** (GitHub Inc., filiale Microsoft) | Hébergement des dépôts de code des sites clients | Nom du projet, slug, contenu généré du site (sans données personnelles des visiteurs) | États-Unis — Clauses contractuelles types |
| **Vercel** (Vercel Inc.) | Déploiement et prévisualisation des sites clients | Identifiants de projet, URL de déploiement, métadonnées techniques | États-Unis — Clauses contractuelles types |
| **Hébergeur de la plateforme Lumero** | Hébergement de la base de données et des fichiers téléversés | Ensemble des données de la plateforme | Union européenne — *[À COMPLÉTER une fois l'hébergeur sélectionné]* |

Aucun de ces sous-traitants n'est autorisé à utiliser vos données pour des finalités propres.

## 5. Transferts hors UE

L'hébergement principal de la plateforme Lumero est réalisé au sein de l'Union européenne. Certains sous-traitants techniques (GitHub, Vercel) sont susceptibles de traiter des données aux États-Unis. Ces transferts sont encadrés par les Clauses contractuelles types adoptées par la Commission européenne et, le cas échéant, par l'adhésion de ces prestataires au cadre Data Privacy Framework UE-US.

## 6. Durées de conservation

| Donnée | Durée |
|---|---|
| Prospects (sans contractualisation) | 3 ans à compter du dernier contact |
| Comptes clients actifs | Pendant toute la durée du contrat |
| Données clients après résiliation | 5 ans (obligations comptables et de prescription) |
| Factures et pièces comptables | 10 ans (Code de commerce) |
| Journaux d'activité et logs techniques | 12 mois maximum |
| Cookies de session | 30 jours |
| Tokens (réinitialisation, vérification, invitations) | De 15 minutes à 30 jours selon le type, supprimés après usage |

À l'issue de ces durées, les données sont supprimées ou anonymisées.

## 7. Sécurité

Lumero met en œuvre des mesures techniques et organisationnelles appropriées :
- Chiffrement TLS pour toutes les communications
- Hashage des mots de passe (bcrypt)
- Authentification à deux facteurs (TOTP) optionnelle
- Sessions limitées dans le temps (JWT signés)
- Contrôle d'accès basé sur les rôles (admin / client)
- Journaux d'audit des actions sensibles
- Sauvegardes régulières
- Validation et limitation des fichiers téléversés (types et taille)

## 8. Cookies

Lumero utilise un nombre minimal de cookies, tous strictement nécessaires au fonctionnement du service :

| Cookie | Finalité | Durée |
|---|---|---|
| `next-auth.session-token` | Maintien de votre session authentifiée | 30 jours |
| `next-auth.callback-url`, `next-auth.csrf-token` | Sécurité de l'authentification | Session |
| `theme` | Mémorisation de votre préférence de thème (clair/sombre) | 1 an |

Aucun cookie publicitaire, analytique ou de mesure d'audience tiers n'est déposé. Le consentement préalable n'est donc pas requis pour ces cookies dits « strictement nécessaires » (art. 82 LIL).

## 9. Vos droits

Conformément aux articles 15 à 22 du RGPD, vous disposez à tout moment des droits suivants :

- **Droit d'accès** : obtenir une copie de vos données
- **Droit de rectification** : corriger des données inexactes ou incomplètes
- **Droit à l'effacement** (« droit à l'oubli »)
- **Droit à la limitation** du traitement
- **Droit d'opposition** au traitement fondé sur l'intérêt légitime
- **Droit à la portabilité** : recevoir vos données dans un format structuré
- **Droit de retirer votre consentement** à tout moment, lorsque le traitement est fondé sur celui-ci
- **Droit de définir des directives** relatives au sort de vos données après votre décès

**Pour exercer ces droits**, contactez-nous à : **kylian.gallot@icloud.com** en précisant l'objet de votre demande. Une réponse vous sera apportée dans un délai maximum d'un mois. Une preuve d'identité pourra être demandée en cas de doute raisonnable.

Vous disposez également du droit d'introduire une réclamation auprès de la **Commission Nationale de l'Informatique et des Libertés (CNIL)** : [www.cnil.fr](https://www.cnil.fr) — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.

## 10. Mineurs

Lumero est un service à destination des professionnels (entreprises, indépendants). Il n'est pas destiné aux personnes de moins de 18 ans et ne collecte pas sciemment de données les concernant. Si vous estimez qu'un mineur nous a transmis ses données, contactez-nous afin que nous procédions à leur suppression.

## 11. Modifications

La présente politique peut être modifiée pour refléter des évolutions légales, techniques ou fonctionnelles. La date de dernière mise à jour figure en tête du document. En cas de modification substantielle, les utilisateurs disposant d'un compte en seront informés par email.

## 12. Contact

Pour toute question relative à la protection de vos données :
- **Email :** kylian.gallot@icloud.com
- **Adresse postale :** Kylian GALLOT — 39 Rue du Chater, 69530 Orliénas, France
