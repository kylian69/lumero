"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChefHat,
  Hammer,
  Briefcase,
  Stethoscope,
  GraduationCap,
  Scissors,
  Camera,
  Scale,
  BookOpen,
  Home as HomeIcon,
  ArrowRight,
  Check,
  FileText,
  Layers,
  Zap,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { FittedMockup, type TemplateId } from "@/components/template-mockup";

type Template = {
  id: TemplateId;
  name: string;
  metier: string;
  tagline: string;
  description: string;
  price: number;
  delay: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  pages: string[];
  features: string[];
  highlights: string[];
  popular?: boolean;
};

const TEMPLATES: Template[] = [
  {
    id: "restaurateur",
    name: "Bistrot",
    metier: "Restaurateur",
    tagline: "Menu appétissant, réservation simple.",
    description:
      "Met votre carte en valeur, sublime vos plats et facilite la réservation, en salle comme à emporter.",
    price: 99,
    delay: "48h",
    icon: ChefHat,
    accent:
      "from-amber-200/60 to-orange-200/40 dark:from-amber-500/20 dark:to-orange-500/10",
    pages: ["Accueil", "Notre cuisine", "Carte & menu", "Réservation", "Contact"],
    features: [
      "Module de réservation en ligne",
      "Carte digitale à jour en un clic",
      "Galerie photo des plats & du lieu",
      "Avis Google intégrés",
      "Connexion à Google My Business",
    ],
    highlights: [
      "Pensé pour le mobile, là où vos clients vous trouvent.",
      "SEO local optimisé pour ressortir sur votre quartier.",
    ],
    popular: true,
  },
  {
    id: "artisan",
    name: "Atelier",
    metier: "Artisan",
    tagline: "Vos réalisations mises en lumière.",
    description:
      "Sobre et crédible, valorise vos chantiers et génère des demandes de devis qualifiées.",
    price: 99,
    delay: "48h",
    icon: Hammer,
    accent:
      "from-slate-200/70 to-zinc-200/40 dark:from-slate-500/20 dark:to-zinc-500/10",
    pages: ["Accueil", "Savoir-faire", "Réalisations", "Demande de devis", "Contact"],
    features: [
      "Galerie de réalisations avec filtres",
      "Formulaire de devis intelligent",
      "Mise en avant des certifications",
      "Témoignages clients",
      "Zone d'intervention sur carte",
    ],
    highlights: [
      "Crédibilité immédiate grâce aux preuves visuelles.",
      "Formulaire optimisé pour ne capter que les vrais leads.",
    ],
  },
  {
    id: "consultant",
    name: "Conseil",
    metier: "Consultant",
    tagline: "Crédibilité instantanée, leads B2B.",
    description:
      "Premium, positionne votre expertise, raconte vos cas clients et déclenche des prises de contact.",
    price: 129,
    delay: "48h",
    icon: Briefcase,
    accent:
      "from-indigo-200/60 to-blue-200/40 dark:from-indigo-500/20 dark:to-blue-500/10",
    pages: ["Accueil", "Expertises", "Cas clients", "À propos", "Contact"],
    features: [
      "Mise en récit des cas clients",
      "Téléchargement de livre blanc",
      "Prise de RDV intégrée (Calendly)",
      "Témoignages & logos clients",
      "Page À propos avec parcours",
    ],
    highlights: [
      "Une scénographie qui inspire confiance dès la première seconde.",
      "Tunnel de conversion calibré pour les prospects B2B.",
    ],
  },
  {
    id: "cabinet",
    name: "Cabinet",
    metier: "Avocat",
    tagline: "Une expertise au service de votre stratégie.",
    description:
      "Site sobre et rassurant pour avocat ou cabinet juridique : expertises, parcours et prise de contact qualifiée.",
    price: 149,
    delay: "72h",
    icon: Scale,
    accent:
      "from-stone-200/70 to-amber-100/40 dark:from-stone-500/20 dark:to-amber-500/10",
    pages: ["Accueil", "Expertises", "Le cabinet", "Honoraires", "Contact"],
    features: [
      "Présentation des domaines d'expertise",
      "Parcours & barreau",
      "Honoraires transparents",
      "Prise de RDV en ligne",
      "Mentions légales conformes",
    ],
    highlights: [
      "Ton institutionnel, conforme aux usages du barreau.",
      "Premier RDV facilité par un formulaire dédié.",
    ],
  },
  {
    id: "sante",
    name: "Clinique",
    metier: "Santé",
    tagline: "Simple, rassurant, accessible.",
    description:
      "Rassurant et conforme, présente le praticien et permet la prise de rendez-vous en ligne.",
    price: 129,
    delay: "48h",
    icon: Stethoscope,
    accent:
      "from-emerald-200/60 to-teal-200/40 dark:from-emerald-500/20 dark:to-teal-500/10",
    pages: ["Accueil", "Le praticien", "Soins & tarifs", "Prise de RDV", "Accès"],
    features: [
      "Connexion Doctolib / agenda en ligne",
      "Présentation du praticien & diplômes",
      "Conventionnement & tarifs",
      "Plan d'accès & horaires",
      "Mentions légales conformes RGPD",
    ],
    highlights: [
      "Ton sobre et rassurant, conforme aux usages du secteur.",
      "Accessibilité renforcée (contraste, navigation clavier).",
    ],
  },
  {
    id: "academy",
    name: "Academy",
    metier: "Formation",
    tagline: "Vendez vos programmes en ligne.",
    description:
      "Site orienté conversion pour présenter vos formations, capter des leads et démontrer vos résultats.",
    price: 149,
    delay: "72h",
    icon: BookOpen,
    accent:
      "from-violet-200/60 to-fuchsia-200/40 dark:from-violet-500/20 dark:to-fuchsia-500/10",
    pages: ["Accueil", "Catalogue", "Mentors", "Avis & résultats", "Réserver"],
    features: [
      "Catalogue de programmes & tarifs",
      "Tunnel de conversion optimisé",
      "Témoignages & études de cas",
      "Page méthode / philosophie",
      "Téléchargement de ressources (PDF)",
    ],
    highlights: [
      "Mise en avant claire de votre proposition de valeur.",
      "Funnel pensé pour transformer le visiteur en apprenant.",
    ],
    popular: true,
  },
  {
    id: "coach",
    name: "Mentor",
    metier: "Coach",
    tagline: "Programmes & sessions sur-mesure.",
    description:
      "Met en avant vos programmes, vos résultats et permet la réservation de sessions individuelles ou collectives.",
    price: 129,
    delay: "48h",
    icon: GraduationCap,
    accent:
      "from-orange-200/60 to-amber-200/40 dark:from-orange-500/20 dark:to-amber-500/10",
    pages: ["Accueil", "Programmes", "Méthode", "Avis", "Réserver"],
    features: [
      "Catalogue de programmes & tarifs",
      "Réservation de sessions en ligne",
      "Témoignages & études de cas",
      "Page méthode / philosophie",
      "Téléchargement de ressources",
    ],
    highlights: [
      "Mise en avant claire de votre proposition de valeur.",
      "Funnel pensé pour transformer le visiteur en participant.",
    ],
  },
  {
    id: "lens",
    name: "Lens",
    metier: "Photographe",
    tagline: "Votre portfolio, plein écran.",
    description:
      "Site immersif pour faire rayonner votre travail visuel et proposer vos offres de shooting.",
    price: 129,
    delay: "72h",
    icon: Camera,
    accent:
      "from-neutral-200/70 to-stone-200/40 dark:from-neutral-500/20 dark:to-stone-500/10",
    pages: ["Accueil", "Portfolio", "Offres", "Studio", "Contact"],
    features: [
      "Portfolio plein écran par catégorie",
      "Offres & tarifs des shootings",
      "Galerie filtrable",
      "Demande de devis dédiée",
      "Optimisation images & SEO",
    ],
    highlights: [
      "Mise en scène éditoriale, sobre et premium.",
      "Pensé pour les prestations mariage, portrait & corporate.",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    metier: "Beauté",
    tagline: "Une esthétique à votre image.",
    description:
      "Met en valeur l'univers du salon, présente l'équipe et facilite la prise de rendez-vous en ligne.",
    price: 99,
    delay: "48h",
    icon: Scissors,
    accent:
      "from-fuchsia-200/60 to-pink-200/40 dark:from-fuchsia-500/20 dark:to-pink-500/10",
    pages: ["Accueil", "Carte des soins", "L'équipe", "Réserver", "Contact"],
    features: [
      "Réservation en ligne (Planity / autre)",
      "Carte des soins & tarifs",
      "Présentation de l'équipe",
      "Galerie avant / après",
      "Bons cadeaux à offrir",
    ],
    highlights: [
      "Identité visuelle forte, ambiance soignée.",
      "Mobile-first pour vos clientes en déplacement.",
    ],
  },
  {
    id: "immobilier",
    name: "Domus",
    metier: "Immobilier",
    tagline: "Vos biens mis en scène.",
    description:
      "Met en scène vos biens, capte les vendeurs avec un outil d'estimation et qualifie les acheteurs.",
    price: 149,
    delay: "72h",
    icon: HomeIcon,
    accent:
      "from-sky-200/60 to-blue-200/40 dark:from-sky-500/20 dark:to-blue-500/10",
    pages: ["Accueil", "Annonces", "Bien à la une", "Estimer mon bien", "Contact"],
    features: [
      "Liste d'annonces filtrable",
      "Fiche bien avec galerie & plan",
      "Formulaire d'estimation en ligne",
      "Alertes par email pour acheteurs",
      "Intégration cartographique",
    ],
    highlights: [
      "Crédibilité haut de gamme avec un design éditorial.",
      "Captation de leads vendeurs et acheteurs.",
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "Restaurateur", label: "Restaurateur" },
  { id: "Artisan", label: "Artisan" },
  { id: "Consultant", label: "Consultant" },
  { id: "Avocat", label: "Avocat" },
  { id: "Santé", label: "Santé" },
  { id: "Formation", label: "Formation" },
  { id: "Coach", label: "Coach" },
  { id: "Photographe", label: "Photographe" },
  { id: "Beauté", label: "Beauté" },
  { id: "Immobilier", label: "Immobilier" },
];

export function Gallery() {
  const [category, setCategory] = React.useState("all");
  const [previewId, setPreviewId] = React.useState<TemplateId | null>(null);
  const [orderId, setOrderId] = React.useState<TemplateId | null>(null);

  const filtered =
    category === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.metier === category);
  const preview = TEMPLATES.find((t) => t.id === previewId) ?? null;
  const order = TEMPLATES.find((t) => t.id === orderId) ?? null;

  const startOrder = (id: TemplateId) => {
    setPreviewId(null);
    setOrderId(id);
  };

  return (
    <section
      id="modeles"
      aria-labelledby="gallery-title"
      className="py-24 sm:py-32 bg-gradient-to-b from-transparent via-muted/30 to-transparent"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Modèles prêts à l&apos;emploi
          </div>
          <h2
            id="gallery-title"
            className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Un site en ligne dès 99€, livré en 48h
          </h2>
          <p className="mt-4 text-muted-foreground">
            Des structures éprouvées par cœur de métier, personnalisées à votre
            marque et optimisées pour le référencement.{" "}
            <span className="text-foreground/80">
              Cliquez sur un modèle pour l&apos;aperçu détaillé.
            </span>
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filtre par métier"
          className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2"
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition-all sm:text-sm",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <motion.div
          layout
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((tpl, i) => {
              const Icon = tpl.icon;
              return (
                <motion.article
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
                >
                  {tpl.popular && (
                    <span className="absolute right-4 top-4 z-10 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-md">
                      Populaire
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewId(tpl.id)}
                    aria-label={`Voir l'aperçu détaillé du modèle ${tpl.name}`}
                    className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div
                      className={cn(
                        "relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br",
                        tpl.accent
                      )}
                    >
                      <div className="absolute inset-3 transition-transform duration-300 group-hover:scale-[1.02]">
                        <FittedMockup id={tpl.id} />
                      </div>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/50 via-black/20 to-transparent py-3 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        Aperçu détaillé
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {tpl.metier}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold tracking-tight">
                      {tpl.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tpl.tagline}
                    </p>

                    <ul className="mt-4 space-y-2">
                      {tpl.features.slice(0, 3).map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-xs text-foreground/80"
                        >
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                            aria-hidden
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-semibold tracking-tight">
                          {tpl.price}€
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {tpl.delay}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewId(tpl.id)}
                      >
                        Aperçu
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-8 text-center sm:p-10">
          <Sparkles className="mx-auto h-6 w-6 text-primary" aria-hidden />
          <h3 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
            Besoin de plus de personnalisation ?
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Les modèles sont rapides et économiques, mais moins flexibles. Pour
            un site 100% sur-mesure, nos offres complètes vous accompagnent de A
            à Z.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <a href="#tarifs">Voir les offres sur-mesure</a>
            </Button>
            <Button asChild>
              <a href="#questionnaire">
                Démarrer un projet sur-mesure
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={preview !== null}
        onClose={() => setPreviewId(null)}
        labelledBy="template-preview-title"
        describedBy="template-preview-description"
        className="max-w-5xl"
      >
        {preview && (
          <TemplatePreview
            template={preview}
            onChoose={() => startOrder(preview.id)}
          />
        )}
      </Dialog>

      <Dialog
        open={order !== null}
        onClose={() => setOrderId(null)}
        labelledBy="template-order-title"
      >
        {order && (
          <TemplateOrderForm
            template={order}
            onClose={() => setOrderId(null)}
          />
        )}
      </Dialog>
    </section>
  );
}

function TemplatePreview({
  template,
  onChoose,
}: {
  template: Template;
  onChoose: () => void;
}) {
  const Icon = template.icon;

  return (
    <div className="grid gap-0 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div
        className={cn(
          "relative flex flex-col justify-center bg-gradient-to-br p-5 sm:p-6",
          template.accent
        )}
      >
        <div className="aspect-[4/3] w-full">
          <FittedMockup id={template.id} />
        </div>
        <p className="mt-3 text-center text-[11px] text-foreground/70">
          Aperçu indicatif — chaque livraison est personnalisée à vos contenus,
          couleurs et logo.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <header>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-primary">
                Modèle · {template.metier}
              </p>
              <h3
                id="template-preview-title"
                className="truncate text-xl font-semibold tracking-tight sm:text-2xl"
              >
                {template.name}
              </h3>
            </div>
          </div>
          <p
            id="template-preview-description"
            className="mt-3 text-sm leading-relaxed text-muted-foreground"
          >
            {template.description}
          </p>
        </header>

        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Prix du modèle
            </span>
            <span className="text-[10px] text-muted-foreground">
              Livraison sous {template.delay}
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight">
              {template.price}€
            </span>
            <span className="text-xs text-muted-foreground">
              · paiement unique
            </span>
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
            <Layers className="h-3 w-3 text-primary" />
            Pages incluses
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {template.pages.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[11px] text-foreground/80"
              >
                <FileText className="h-2.5 w-2.5 text-muted-foreground" />
                {p}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
            <Zap className="h-3 w-3 text-primary" />
            Fonctionnalités clés
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px]">
            {template.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-2 w-2" />
                </span>
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <ul className="space-y-1 text-[11px] text-foreground/80">
            {template.highlights.map((h) => (
              <li key={h} className="flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-col gap-2 lg:flex-row">
          <Button onClick={onChoose} className="min-w-0 flex-1">
            Choisir ce modèle
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline" className="min-w-0 flex-1">
            <a href="#tarifs">Voir les tarifs</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

type OrderFormState = {
  entreprise: string;
  email: string;
  telephone: string;
  details: string;
};

function TemplateOrderForm({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<OrderFormState>({
    entreprise: "",
    email: "",
    telephone: "",
    details: "",
  });
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">(
    "idle"
  );
  const Icon = template.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => setStatus("success"), 1200);
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center px-8 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3
          id="template-order-title"
          className="mt-6 text-2xl font-semibold tracking-tight"
        >
          Demande envoyée !
        </h3>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Merci {form.entreprise || "à vous"}. Notre équipe vous contactera
          sous 24h pour valider votre modèle <strong>{template.name}</strong>{" "}
          et finaliser la personnalisation.
        </p>
        <Button onClick={onClose} className="mt-8">
          Parfait, fermer
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative flex items-center gap-4 border-b border-border/60 bg-gradient-to-br p-6",
          template.accent
        )}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background/90 text-primary shadow-md">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
            Modèle · {template.metier}
          </p>
          <h3
            id="template-order-title"
            className="text-2xl font-semibold tracking-tight"
          >
            {template.name}
          </h3>
          <p className="mt-0.5 text-sm text-foreground/80">
            {template.tagline}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Prix du modèle
            </span>
            <span className="text-xs text-muted-foreground">
              Livraison sous {template.delay}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight">
              {template.price}€
            </span>
            <span className="text-sm text-muted-foreground">
              · paiement unique
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor={`entreprise-${template.id}`}
            className="mb-1.5 block text-sm font-medium"
          >
            Nom de l&apos;entreprise <span className="text-rose-500">*</span>
          </label>
          <Input
            id={`entreprise-${template.id}`}
            required
            value={form.entreprise}
            onChange={(e) =>
              setForm((f) => ({ ...f, entreprise: e.target.value }))
            }
            placeholder="Lumero Studio"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`email-${template.id}`}
              className="mb-1.5 block text-sm font-medium"
            >
              Email <span className="text-rose-500">*</span>
            </label>
            <Input
              id={`email-${template.id}`}
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="vous@exemple.fr"
            />
          </div>
          <div>
            <label
              htmlFor={`tel-${template.id}`}
              className="mb-1.5 block text-sm font-medium"
            >
              Téléphone
            </label>
            <Input
              id={`tel-${template.id}`}
              type="tel"
              value={form.telephone}
              onChange={(e) =>
                setForm((f) => ({ ...f, telephone: e.target.value }))
              }
              placeholder="06 12 34 56 78"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`details-${template.id}`}
            className="mb-1.5 block text-sm font-medium"
          >
            Informations de personnalisation
          </label>
          <Textarea
            id={`details-${template.id}`}
            rows={4}
            value={form.details}
            onChange={(e) =>
              setForm((f) => ({ ...f, details: e.target.value }))
            }
            placeholder="Vos horaires, couleurs préférées, slogan, informations clés à afficher…"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Nous reviendrons vers vous pour finaliser logo, couleurs et
            contenus. Vous n&apos;êtes pas obligé·e de tout remplir maintenant.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            En validant, aucun paiement n&apos;est effectué. Nous vous
            recontactons pour confirmer.
          </p>
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                Valider le modèle
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
