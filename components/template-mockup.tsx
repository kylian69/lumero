"use client";

import * as React from "react";
import {
  ChefHat,
  Hammer,
  Briefcase,
  Stethoscope,
  GraduationCap,
  Scissors,
  Home,
  Camera,
  Scale,
  BookOpen,
  Star,
  Clock,
  MapPin,
  Phone,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  Users,
  Award,
  Search,
  Bed,
  PlayCircle,
  ImageIcon,
  Aperture,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TemplateId =
  | "restaurateur"
  | "artisan"
  | "consultant"
  | "cabinet"
  | "sante"
  | "academy"
  | "coach"
  | "lens"
  | "studio"
  | "immobilier";

const DESIGN_WIDTH = 480;
const DESIGN_HEIGHT = 360;

/**
 * Scales a fixed design (DESIGN_WIDTH x DESIGN_HEIGHT) to fit any container
 * while preserving the 4:3 aspect ratio. Avoids viewport-breakpoint surprises
 * when a "site preview" is rendered inside a small thumbnail.
 */
export function FittedMockup({
  id,
  className,
}: {
  id: TemplateId;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      setScale(Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale || 0.0001})`,
          transformOrigin: "center center",
          opacity: scale ? 1 : 0,
        }}
      >
        <TemplateMockup id={id} />
      </div>
    </div>
  );
}

/**
 * The fixed-size 480×360 site mockup. Always rendered at design size; use
 * <FittedMockup /> to embed it in arbitrary containers.
 */
export function TemplateMockup({ id }: { id: TemplateId }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/60 bg-white text-[11px] text-zinc-900 shadow-lg dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-black/5 px-3 py-2 dark:border-white/10">
        <span className="h-2 w-2 rounded-full bg-red-400/70" />
        <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
        <span className="h-2 w-2 rounded-full bg-green-400/70" />
        <span className="ml-2 h-3 flex-1 rounded-full bg-black/5 dark:bg-white/5" />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {id === "restaurateur" && <RestaurateurMockup />}
        {id === "artisan" && <ArtisanMockup />}
        {id === "consultant" && <ConsultantMockup />}
        {id === "cabinet" && <CabinetMockup />}
        {id === "sante" && <SanteMockup />}
        {id === "academy" && <AcademyMockup />}
        {id === "coach" && <CoachMockup />}
        {id === "lens" && <LensMockup />}
        {id === "studio" && <StudioMockup />}
        {id === "immobilier" && <ImmobilierMockup />}
      </div>
    </div>
  );
}

// ---------- Shared building blocks ----------

function SiteHeader({
  brand,
  links,
  cta,
  accent,
  Icon,
}: {
  brand: string;
  links: string[];
  cta: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/5 px-4 py-2.5 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white",
            accent
          )}
        >
          <Icon className="h-3 w-3" />
        </span>
        <span className="truncate font-semibold tracking-tight">{brand}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-zinc-500 dark:text-zinc-400">
        {links.map((l) => (
          <span key={l} className="whitespace-nowrap">
            {l}
          </span>
        ))}
      </div>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium text-white",
          accent
        )}
      >
        {cta}
      </span>
    </div>
  );
}

// ---------- Per-trade mockups ----------

function RestaurateurMockup() {
  return (
    <>
      <SiteHeader
        brand="Le Lumero"
        links={["Carte", "Réserver", "Contact"]}
        cta="Réserver"
        accent="bg-amber-500"
        Icon={ChefHat}
      />

      <div className="shrink-0 bg-gradient-to-br from-amber-50 to-orange-100/60 px-4 py-3 dark:from-amber-500/10 dark:to-orange-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Cuisine de saison
        </p>
        <p className="mt-0.5 font-serif text-[15px] font-semibold leading-tight">
          Une table où le produit raconte l&apos;histoire.
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          <span className="ml-1">4,9 · 312 avis</span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2 p-3">
        {[
          { name: "Entrée", price: "14 €" },
          { name: "Plat", price: "26 €" },
          { name: "Dessert", price: "11 €" },
        ].map((d) => (
          <div
            key={d.name}
            className="flex flex-col rounded-md border border-black/5 bg-white p-1.5 dark:border-white/10 dark:bg-white/5"
          >
            <div className="aspect-[4/3] rounded bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-500/20 dark:to-orange-500/10" />
            <p className="mt-1 truncate text-[11px] font-medium">{d.name}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {d.price}
            </p>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 text-[10px] text-zinc-600 dark:border-white/10 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-600" />
          Mar-Sam · 12h-14h · 19h-22h
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-amber-600" />
          12 rue de Lyon, Paris
        </span>
      </div>
    </>
  );
}

function ArtisanMockup() {
  return (
    <>
      <SiteHeader
        brand="Atelier Lumero"
        links={["Réalisations", "Métier", "Devis"]}
        cta="Devis"
        accent="bg-zinc-700"
        Icon={Hammer}
      />

      <div className="shrink-0 bg-gradient-to-br from-zinc-50 to-zinc-200/60 px-4 py-3 dark:from-white/5 dark:to-white/0">
        <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Menuiserie · Sur mesure
        </p>
        <p className="mt-0.5 text-[15px] font-semibold leading-tight">
          Le bois travaillé avec exigence.
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Award className="h-2.5 w-2.5" /> 18 ans d&apos;expérience
          </span>
          <span>·</span>
          <span>Île-de-France</span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-md bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800"
          >
            <div className="h-full w-full rounded-md bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent_60%)]" />
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <Phone className="h-3 w-3" /> 06 12 34 56 78
        </span>
        <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-white dark:bg-white dark:text-zinc-900">
          Demander un devis
        </span>
      </div>
    </>
  );
}

function ConsultantMockup() {
  return (
    <>
      <SiteHeader
        brand="Lumero Conseil"
        links={["Expertises", "Cas clients", "À propos"]}
        cta="Échanger"
        accent="bg-indigo-600"
        Icon={Briefcase}
      />

      <div className="shrink-0 bg-gradient-to-br from-indigo-50 to-blue-100/60 px-4 py-3 dark:from-indigo-500/10 dark:to-blue-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
          Stratégie & transformation
        </p>
        <p className="mt-0.5 text-[15px] font-semibold leading-tight">
          Des décisions claires, un cap tenu.
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[
            { v: "15 ans", l: "d'expertise", I: TrendingUp },
            { v: "50+", l: "clients accompagnés", I: Users },
            { v: "94%", l: "renouvellements", I: CheckCircle2 },
          ].map(({ v, l, I }) => (
            <div
              key={l}
              className="rounded-md border border-indigo-100 bg-white p-1.5 dark:border-white/10 dark:bg-white/5"
            >
              <I className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              <p className="mt-0.5 text-[11px] font-semibold leading-none">
                {v}
              </p>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {[
          "Stratégie d'entreprise",
          "Transformation organisationnelle",
          "Pilotage de la performance",
        ].map((s) => (
          <div
            key={s}
            className="flex items-center justify-between rounded-md border border-black/5 bg-white px-2.5 py-1.5 text-[11px] dark:border-white/10 dark:bg-white/5"
          >
            <span className="truncate font-medium">{s}</span>
            <span className="shrink-0 text-indigo-600 dark:text-indigo-400">
              →
            </span>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-black/5 bg-indigo-50/40 px-4 py-2 text-[10px] italic text-zinc-600 dark:border-white/10 dark:bg-indigo-500/5 dark:text-zinc-400">
        « Un accompagnement structuré qui a transformé notre comité de direction. »
        <span className="ml-1 not-italic text-zinc-400">— C. Dupont, COO</span>
      </div>
    </>
  );
}

function SanteMockup() {
  const slots = ["09:30", "10:15", "11:00", "14:30", "15:15", "16:00"];

  return (
    <>
      <SiteHeader
        brand="Cabinet Lumero"
        links={["Praticien", "Soins", "Accès"]}
        cta="Prendre RDV"
        accent="bg-emerald-600"
        Icon={Stethoscope}
      />

      <div className="shrink-0 bg-gradient-to-br from-emerald-50 to-teal-100/60 px-4 py-3 dark:from-emerald-500/10 dark:to-teal-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          Médecine générale
        </p>
        <p className="mt-0.5 text-[15px] font-semibold leading-tight">
          Dr. Martin · Consultations sur RDV
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" /> Lyon 6ᵉ
          </span>
          <span>·</span>
          <span>Conventionné · Carte vitale</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between text-[11px]">
          <p className="font-medium">Disponibilités · Aujourd&apos;hui</p>
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="h-3 w-3" /> En ligne
          </span>
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {slots.map((t, i) => (
            <span
              key={t}
              className={cn(
                "rounded-md border py-1.5 text-center text-[10px] font-medium",
                i === 1
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-500/30 dark:bg-white/5 dark:text-emerald-300"
              )}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 text-[10px] text-zinc-600 dark:border-white/10 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-emerald-600" />
          Lun-Ven · 9h-19h
        </span>
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-emerald-600" />
          04 78 12 34 56
        </span>
      </div>
    </>
  );
}

function CoachMockup() {
  const programs = [
    { name: "Session 1h", price: "90 €", note: "Visio · 1-à-1" },
    { name: "Atelier groupe", price: "240 €", note: "1/2 journée" },
    { name: "Parcours 6 mois", price: "1 800 €", note: "Premium" },
  ];
  return (
    <>
      <SiteHeader
        brand="Lumero Academy"
        links={["Programmes", "Avis", "Méthode"]}
        cta="Réserver"
        accent="bg-violet-600"
        Icon={GraduationCap}
      />

      <div className="shrink-0 bg-gradient-to-br from-violet-50 to-purple-100/60 px-4 py-3 dark:from-violet-500/10 dark:to-purple-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-violet-700 dark:text-violet-300">
          Coaching & formation
        </p>
        <p className="mt-0.5 text-[15px] font-semibold leading-tight">
          Atteignez vos objectifs avec un cap clair.
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Star className="h-2.5 w-2.5 fill-violet-500 text-violet-500" />{" "}
            4,9 · 86 avis
          </span>
          <span>·</span>
          <span>Taux de satisfaction · 98 %</span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2 p-3">
        {programs.map((p) => (
          <div
            key={p.name}
            className="flex flex-col rounded-md border border-violet-100 bg-white p-2 dark:border-white/10 dark:bg-white/5"
          >
            <div className="h-1 w-6 rounded-full bg-violet-500" />
            <p className="mt-1.5 text-[11px] font-semibold leading-tight">
              {p.name}
            </p>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-400">
              {p.note}
            </p>
            <p className="mt-auto text-[11px] font-semibold text-violet-700 dark:text-violet-300">
              {p.price}
            </p>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <CalendarCheck className="h-3 w-3 text-violet-600" />
          Prochaine session : mar. 14h
        </span>
        <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-medium text-white">
          Prendre RDV
        </span>
      </div>
    </>
  );
}

function CabinetMockup() {
  const expertises = [
    "Droit du travail",
    "Droit des sociétés",
    "Contentieux commercial",
  ];
  return (
    <>
      <SiteHeader
        brand="Cabinet Lumero"
        links={["Expertises", "Cabinet", "Honoraires"]}
        cta="Prendre RDV"
        accent="bg-stone-700"
        Icon={Scale}
      />

      <div className="shrink-0 bg-gradient-to-br from-stone-50 to-amber-50/60 px-4 py-3 dark:from-stone-500/10 dark:to-amber-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-stone-600 dark:text-stone-300">
          Avocat · Barreau de Paris
        </p>
        <p className="mt-0.5 font-serif text-[15px] font-semibold leading-tight">
          Une expertise au service de votre stratégie.
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Award className="h-2.5 w-2.5" /> 22 ans d&apos;expérience
          </span>
          <span>·</span>
          <span>Premier RDV gratuit</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {expertises.map((e) => (
          <div
            key={e}
            className="flex items-center justify-between rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] dark:border-white/10 dark:bg-white/5"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-3 rounded-full bg-stone-700 dark:bg-stone-400" />
              <span className="truncate font-medium">{e}</span>
            </span>
            <span className="shrink-0 text-stone-700 dark:text-stone-300">
              →
            </span>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <MapPin className="h-3 w-3 text-stone-700" />
          15 rue de la Paix, Paris 8ᵉ
        </span>
        <span className="rounded-full bg-stone-800 px-2.5 py-1 text-[10px] font-medium text-white">
          Prendre RDV
        </span>
      </div>
    </>
  );
}

function AcademyMockup() {
  const courses = [
    { name: "SEO Avancé", duration: "12h", rating: "4,9" },
    { name: "Copywriting", duration: "8h", rating: "4,8" },
    { name: "No-code", duration: "16h", rating: "4,9" },
  ];
  return (
    <>
      <SiteHeader
        brand="Lumero Academy"
        links={["Catalogue", "Mentors", "Avis"]}
        cta="Commencer"
        accent="bg-violet-600"
        Icon={BookOpen}
      />

      <div className="shrink-0 bg-gradient-to-br from-violet-50 to-fuchsia-100/60 px-4 py-3 dark:from-violet-500/10 dark:to-fuchsia-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-violet-700 dark:text-violet-300">
          Formations métier · 100 % en ligne
        </p>
        <p className="mt-0.5 text-[15px] font-semibold leading-tight">
          Apprenez à votre rythme, avec des experts.
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5" /> 2 400 apprenants
          </span>
          <span>·</span>
          <span>Certifiantes</span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2 p-3">
        {courses.map((c) => (
          <div
            key={c.name}
            className="flex flex-col overflow-hidden rounded-md border border-violet-100 bg-white dark:border-white/10 dark:bg-white/5"
          >
            <div className="relative aspect-[4/3] bg-gradient-to-br from-violet-200 to-fuchsia-200 dark:from-violet-500/20 dark:to-fuchsia-500/10">
              <span className="absolute inset-0 flex items-center justify-center text-violet-700 dark:text-violet-200">
                <PlayCircle className="h-5 w-5" />
              </span>
            </div>
            <div className="p-1.5">
              <p className="truncate text-[10px] font-semibold">{c.name}</p>
              <p className="flex items-center gap-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                <Clock className="h-2 w-2" /> {c.duration}
                <span className="ml-auto flex items-center gap-0.5 text-violet-700 dark:text-violet-300">
                  <Star className="h-2 w-2 fill-violet-500 text-violet-500" />
                  {c.rating}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <CheckCircle2 className="h-3 w-3 text-violet-600" />
          Accès à vie · Garantie 30 jours
        </span>
        <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-medium text-white">
          Voir le catalogue
        </span>
      </div>
    </>
  );
}

function LensMockup() {
  return (
    <>
      <SiteHeader
        brand="Atelier Lens"
        links={["Portfolio", "Offres", "Studio"]}
        cta="Réserver"
        accent="bg-neutral-900"
        Icon={Camera}
      />

      <div className="shrink-0 bg-gradient-to-br from-neutral-50 to-stone-200/60 px-4 py-3 dark:from-white/5 dark:to-white/0">
        <p className="text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Mariages · Portraits · Corporate
        </p>
        <p className="mt-0.5 font-serif text-[15px] font-semibold leading-tight">
          L&apos;instant capturé, la mémoire intacte.
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Aperture className="h-2.5 w-2.5" /> 8 ans · 240 reportages
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-4 gap-1.5 p-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-sm",
              i % 3 === 0
                ? "bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-600 dark:to-neutral-800"
                : i % 2 === 0
                ? "bg-gradient-to-br from-stone-300 to-stone-400 dark:from-stone-700 dark:to-stone-800"
                : "bg-gradient-to-br from-zinc-300 to-zinc-500 dark:from-zinc-700 dark:to-zinc-800"
            )}
          >
            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45),transparent_55%)]" />
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <ImageIcon className="h-3 w-3 text-neutral-700" />
          Booking ouvert · sept – déc
        </span>
        <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-medium text-white dark:bg-white dark:text-neutral-900">
          Demander un devis
        </span>
      </div>
    </>
  );
}

function StudioMockup() {
  const services = [
    { name: "Coupe + brushing", price: "45 €", duration: "45 min" },
    { name: "Coloration", price: "à partir de 90 €", duration: "1h30" },
    { name: "Soin profond", price: "60 €", duration: "30 min" },
  ];
  return (
    <>
      <SiteHeader
        brand="Salon Lumero"
        links={["Carte", "Équipe", "Avis"]}
        cta="Réserver"
        accent="bg-fuchsia-600"
        Icon={Scissors}
      />

      <div className="shrink-0 bg-gradient-to-br from-fuchsia-50 to-pink-100/60 px-4 py-3 dark:from-fuchsia-500/10 dark:to-pink-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
          Coiffure · Soins
        </p>
        <p className="mt-0.5 font-serif text-[15px] font-semibold leading-tight">
          Le détail qui change tout.
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <Star className="h-2.5 w-2.5 fill-fuchsia-500 text-fuchsia-500" />
          <Star className="h-2.5 w-2.5 fill-fuchsia-500 text-fuchsia-500" />
          <Star className="h-2.5 w-2.5 fill-fuchsia-500 text-fuchsia-500" />
          <Star className="h-2.5 w-2.5 fill-fuchsia-500 text-fuchsia-500" />
          <Star className="h-2.5 w-2.5 fill-fuchsia-500 text-fuchsia-500" />
          <span className="ml-1">5,0 · 214 avis Google</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {services.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-md border border-fuchsia-100 bg-white px-2.5 py-1.5 text-[11px] dark:border-white/10 dark:bg-white/5"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{s.name}</p>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400">
                {s.duration}
              </p>
            </div>
            <span className="shrink-0 font-semibold text-fuchsia-700 dark:text-fuchsia-300">
              {s.price}
            </span>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <CalendarCheck className="h-3 w-3 text-fuchsia-600" />
          Prochain RDV : jeu. 17h
        </span>
        <span className="rounded-full bg-fuchsia-600 px-2.5 py-1 text-[10px] font-medium text-white">
          Prendre RDV
        </span>
      </div>
    </>
  );
}

function ImmobilierMockup() {
  const listings = [
    { type: "T3 · Lyon 7", area: "72 m²", price: "365 000 €" },
    { type: "Maison · Tassin", area: "140 m²", price: "680 000 €" },
    { type: "Loft · Croix-Rousse", area: "95 m²", price: "480 000 €" },
  ];
  return (
    <>
      <SiteHeader
        brand="Lumero Immo"
        links={["Annonces", "Estimer", "Contact"]}
        cta="Estimer"
        accent="bg-sky-600"
        Icon={Home}
      />

      <div className="shrink-0 bg-gradient-to-br from-sky-50 to-blue-100/60 px-4 py-3 dark:from-sky-500/10 dark:to-blue-500/5">
        <p className="text-[9px] font-medium uppercase tracking-wider text-sky-700 dark:text-sky-300">
          Sélection · Lyon & alentours
        </p>
        <p className="mt-0.5 font-serif text-[15px] font-semibold leading-tight">
          Votre prochain chez-vous.
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Search className="h-2.5 w-2.5" /> Filtrer · Type · Surface · Prix
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2 p-3">
        {listings.map((l) => (
          <div
            key={l.type}
            className="flex flex-col overflow-hidden rounded-md border border-black/5 bg-white dark:border-white/10 dark:bg-white/5"
          >
            <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-500/20 dark:to-blue-500/10">
              <span className="absolute left-1 top-1 rounded bg-white/80 px-1 py-0.5 text-[8px] font-medium text-sky-700 dark:bg-zinc-900/80 dark:text-sky-300">
                Nouveau
              </span>
            </div>
            <div className="flex flex-1 flex-col p-1.5">
              <p className="truncate text-[10px] font-semibold">{l.type}</p>
              <p className="flex items-center gap-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                <Bed className="h-2 w-2" /> {l.area}
              </p>
              <p className="mt-auto text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                {l.price}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <span className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <MapPin className="h-3 w-3 text-sky-600" />
          +12 nouveaux biens cette semaine
        </span>
        <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[10px] font-medium text-white">
          Voir les annonces
        </span>
      </div>
    </>
  );
}
