# Paiement & facturation — mise en production

Guide opérationnel pour activer le paiement Stripe et la facturation en
production. Le système est conçu pour ne **jamais bloquer** un environnement :
si `STRIPE_SECRET_KEY` est absente, l'app masque les boutons de paiement et
retombe sur le flux manuel (demande de facture via le support).

> Rappel : utilisez **toujours** les clés de TEST (`sk_test_…`) sur le poste
> de dev et en staging, et les clés LIVE (`sk_live_…`) uniquement en
> production. Ne mélangez jamais une clé de test avec un secret webhook de
> prod (ou l'inverse) : la vérification de signature échouera (HTTP 400).

---

## Architecture en bref

- **Paiement unique (setup)** et **abonnement mensuel** via Stripe Checkout
  (page hébergée par Stripe — aucune donnée de carte ne transite par Lumero).
- **Webhook** `/api/stripe/webhook` : confirme les paiements, crée/maj les
  abonnements, génère les factures internes et déclenche l'email de facture.
- **Facture interne** : numérotation séquentielle continue `LUM-AAAA-000001`
  + facture PDF conforme générée par Stripe (visible dans l'espace client).
- **Customer Portal** Stripe : le client gère moyen de paiement, factures et
  résiliation en self-service (`/api/portal/billing-portal`).

### Événements webhook écoutés
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Variables d'environnement
| Variable | Rôle |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_live_…` en prod) |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook (`whsec_…`, **propre à chaque endpoint**) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optionnel (checkout hébergé, non requis) |
| `LUMERO_VAT_RATE_BPS` | TVA en points de base. `0` = franchise (art. 293 B CGI), `2000` = 20 % |

---

## Checklist de passage en production

### 1. Dashboard Stripe (mode production)
- [ ] Basculer le Dashboard en **Mode production** (interrupteur en haut à droite).
- [ ] **Activer le compte** (Stripe demande les infos légales : entreprise,
      IBAN de versement, justificatifs). Sans ça, pas d'encaissement réel.
- [ ] **Réglages → Facturation → Factures** : renseigner les informations
      d'émetteur (raison sociale, **SIREN 919 325 530**, adresse) — elles
      apparaissent sur les PDF. Activer la numérotation.
- [ ] **Réglages → Facturation → Portail client** : configurer et **activer**
      le Customer Portal (autoriser : mise à jour du moyen de paiement,
      téléchargement des factures, annulation d'abonnement).
- [ ] Récupérer la **clé secrète live** dans Développeurs → Clés API.

### 2. Webhook de production
- [ ] **Développeurs → Webhooks → Ajouter un endpoint**.
- [ ] URL : `https://lumero.fr/api/stripe/webhook` (https, sans slash final).
- [ ] Sélectionner les 5 événements listés ci-dessus.
- [ ] Copier le **Signing secret** (`whsec_…`) — il est **différent** de celui
      de test.

### 3. Infrastructure
- [ ] Vérifier que `/api/stripe/webhook` n'est **pas** derrière une protection
      qui redirige (Cloudflare Access, auth proxy…). Symptôme : Stripe affiche
      un code **302** sur l'événement. Si la prod est protégée, ajouter une
      règle **Bypass** sur le chemin `/api/stripe/webhook`.
      Test rapide : `curl -sI -X POST https://lumero.fr/api/stripe/webhook`
      doit renvoyer un `400` (signature manquante), **pas** un `302`.

### 4. Variables d'environnement de prod (`.env`)
- [ ] `STRIPE_SECRET_KEY="sk_live_…"`
- [ ] `STRIPE_WEBHOOK_SECRET="whsec_…"` (celui de l'endpoint de prod)
- [ ] `LUMERO_VAT_RATE_BPS="0"` (ou `2000` si assujetti à la TVA)
- [ ] Redémarrer l'app pour relire l'environnement :
      `docker compose -f docker-compose.prod.yml up -d`

### 5. Base de données
- [ ] Appliquer la migration sur la base de prod :
      `npx prisma migrate deploy`
      (crée les tables `Payment` / `Invoice` et les champs Stripe).

### 6. Validation post-déploiement (à blanc)
- [ ] `curl -sI -X POST https://lumero.fr/api/stripe/webhook` → **400** attendu.
- [ ] Faire un vrai paiement de bout en bout (petit montant) avec une vraie
      carte, OU vérifier en dernier le passage test→prod avant communication.
- [ ] Dans Stripe → Webhooks → endpoint de prod : l'événement
      `checkout.session.completed` est en **200** (vert).
- [ ] Côté app : le site passe en payé, la facture `LUM-AAAA-…` apparaît dans
      l'espace client, l'email de facture est reçu.
- [ ] Tester le bouton « Gérer mes paiements » (Customer Portal) depuis
      l'espace client.

---

## Dépannage

| Symptôme | Cause probable | Correctif |
|---|---|---|
| Webhook en **302** | Endpoint derrière une redirection (Cloudflare Access) | Ajouter un Bypass sur `/api/stripe/webhook` |
| Webhook en **400** | `STRIPE_WEBHOOK_SECRET` erroné ou app non redémarrée, ou mélange test/live | Recopier le bon `whsec_` et redémarrer |
| Webhook en **500 / « Webhook not configured »** | `STRIPE_WEBHOOK_SECRET` vide | Renseigner la variable + redémarrer |
| Paiement OK mais site non mis à jour | Webhook non livré | Vérifier l'endpoint Stripe, puis **Renvoyer** l'événement (le traitement est idempotent) |
| « Gérer mes paiements » échoue | Customer Portal non activé | Activer le portail dans Réglages → Facturation |

> Rejouer un événement depuis Stripe (**Renvoyer**) est sans danger : le code
> est idempotent (anti-doublon sur les factures et les paiements).

## Logs

En production, les `console.error` / `console.warn` sont conservés (voir
`next.config.mjs`). Pour suivre les webhooks :

```bash
docker compose -f docker-compose.prod.yml logs -f app | grep -i stripe
```
