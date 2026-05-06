# Lumero

Site vitrine de **Lumero**, plateforme Website-as-a-Service qui déploie un site professionnel optimisé SEO en moins de 24 heures.

## Stack

- **Framework** : Next.js 15 (App Router)
- **Styling** : Tailwind CSS + primitives Shadcn/UI
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Font** : Inter (Google Fonts)
- **Thèmes** : next-themes (clair/sombre)

## Démarrage

```bash
npm install
npm run dev
```

Le site est disponible sur [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Analyse ESLint |

## Structure

```
app/
  layout.tsx        # Métadonnées globales, polices, thème
  page.tsx          # Landing page (assemblage des sections)
  sitemap.ts        # Sitemap dynamique
  robots.ts         # robots.txt dynamique
  globals.css       # Design tokens Tailwind
components/
  sections/         # Sections de la landing
  ui/               # Primitives Shadcn (Button, Card, Input)
  theme-provider.tsx
  theme-toggle.tsx
lib/utils.ts
```

## SEO

- Métadonnées dynamiques (title, description, OpenGraph, Twitter card)
- `sitemap.xml` et `robots.txt` générés automatiquement
- Structure sémantique (`h1`, `section`, `article`, `nav`, `main`)
- Données structurées JSON-LD (`Organization` + offres)
- Polices auto-hébergées via `next/font`
