"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Hammer,
  Briefcase,
  Stethoscope,
  CalendarCheck,
  ShoppingBag,
  Store,
  Minus,
  LayoutGrid,
  Palette,
  CheckCircle2,
  Loader2,
  Scissors,
  Home,
  GraduationCap,
  Camera,
  Scale,
  Users,
  Dumbbell,
  Sparkles,
  Megaphone,
  UserPlus,
  Newspaper,
  CreditCard,
  PenLine,
  Images,
  Star,
  Mail,
  Globe,
  FileText,
  MapPin,
  Lock,
  MessageCircle,
  Package,
  ChevronDown,
  Upload,
  Trash2,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Answers = {
  metier: string;
  metierCustom: string;
  objectifs: string[];
  objectifCustom: string;
  style: string;
  inspiration: string;
  logoName: string;
  logoPreview: string;
  couleur: string;
  fonctionnalites: string[];
  siteActuel: string;
  googleBusiness: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  entreprise: string;
  email: string;
  telephone: string;
  message: string;
};

const METIERS_POPULAR = [
  { id: "restaurateur", label: "Restaurateur", icon: ChefHat },
  { id: "artisan", label: "Artisan", icon: Hammer },
  { id: "consultant", label: "Consultant", icon: Briefcase },
  { id: "sante", label: "Santé", icon: Stethoscope },
  { id: "coach", label: "Coach / Formateur", icon: GraduationCap },
  { id: "ecommerce", label: "E-commerce", icon: ShoppingBag },
];

const METIERS_MORE = [
  { id: "beaute", label: "Coiffure & beauté", icon: Scissors },
  { id: "immobilier", label: "Immobilier", icon: Home },
  { id: "photographe", label: "Photographe", icon: Camera },
  { id: "juridique", label: "Juridique / Conseil", icon: Scale },
  { id: "bien-etre", label: "Bien-être / Sport", icon: Dumbbell },
  { id: "association", label: "Association", icon: Users },
];

const OBJECTIFS = [
  {
    id: "rdv",
    label: "Prise de rendez-vous",
    description: "Laisser mes clients réserver en ligne.",
    icon: CalendarCheck,
  },
  {
    id: "vente",
    label: "Vente en ligne",
    description: "Vendre des produits ou services directement.",
    icon: ShoppingBag,
  },
  {
    id: "vitrine",
    label: "Vitrine",
    description: "Présenter mon activité et gagner en crédibilité.",
    icon: Store,
  },
  {
    id: "leads",
    label: "Génération de leads",
    description: "Collecter des prospects qualifiés.",
    icon: Megaphone,
  },
  {
    id: "recrutement",
    label: "Recrutement",
    description: "Attirer des candidats et présenter l'équipe.",
    icon: UserPlus,
  },
  {
    id: "communaute",
    label: "Informer / Communauté",
    description: "Fédérer autour de mon contenu.",
    icon: Newspaper,
  },
];

const STYLES = [
  { id: "minimaliste", label: "Minimaliste", description: "Épuré, aéré, intemporel.", icon: Minus },
  { id: "professionnel", label: "Professionnel", description: "Structuré, rassurant, sérieux.", icon: LayoutGrid },
  { id: "creatif", label: "Créatif", description: "Audacieux, coloré, mémorable.", icon: Palette },
];

const FONCTIONNALITES = [
  { id: "rdv", label: "Prise de RDV", icon: CalendarCheck },
  { id: "paiement", label: "Paiement en ligne", icon: CreditCard },
  { id: "blog", label: "Blog", icon: PenLine },
  { id: "galerie", label: "Galerie photos", icon: Images },
  { id: "temoignages", label: "Témoignages", icon: Star },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "multilingue", label: "Multilingue", icon: Globe },
  { id: "devis", label: "Formulaire de devis", icon: FileText },
  { id: "carte", label: "Carte / itinéraire", icon: MapPin },
  { id: "membres", label: "Espace membres", icon: Lock },
  { id: "chat", label: "Chat en ligne", icon: MessageCircle },
  { id: "catalogue", label: "Catalogue produits", icon: Package },
];

const STEPS = [
  "metier",
  "objectif",
  "style",
  "identite",
  "fonctionnalites",
  "contenu",
  "coordonnees",
  "loading",
] as const;
type Step = (typeof STEPS)[number];
const TOTAL_STEPS = STEPS.length - 1;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const EMPTY: Answers = {
  metier: "",
  metierCustom: "",
  objectifs: [],
  objectifCustom: "",
  style: "",
  inspiration: "",
  logoName: "",
  logoPreview: "",
  couleur: "#4F46E5",
  fonctionnalites: [],
  siteActuel: "",
  googleBusiness: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  entreprise: "",
  email: "",
  telephone: "",
  message: "",
};

const COLOR_PRESETS = [
  { hex: "#4F46E5", name: "Indigo" },
  { hex: "#0EA5E9", name: "Azur" },
  { hex: "#10B981", name: "Émeraude" },
  { hex: "#F43F5E", name: "Rose" },
  { hex: "#F59E0B", name: "Ambre" },
  { hex: "#8B5CF6", name: "Violet" },
  { hex: "#475569", name: "Ardoise" },
  { hex: "#0F172A", name: "Nuit" },
];

export function Questionnaire() {
  const { data: session, status: sessionStatus } = useSession();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [answers, setAnswers] = React.useState<Answers>(EMPTY);
  const [showAllMetiers, setShowAllMetiers] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitResult, setSubmitResult] = React.useState<boolean>(false);
  const [accountExists, setAccountExists] = React.useState(false);
  const [requiresLogin, setRequiresLogin] = React.useState(false);
  const [tempPassword, setTempPassword] = React.useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = React.useState(false);

  React.useEffect(() => {
    if (METIERS_MORE.some((m) => m.id === answers.metier)) {
      setShowAllMetiers(true);
    }
  }, [answers.metier]);

  const step: Step = STEPS[stepIndex];

  const canAdvance = React.useMemo(() => {
    switch (step) {
      case "metier":
        return (
          (!!answers.metier && answers.metier !== "autre") ||
          (answers.metier === "autre" && answers.metierCustom.trim().length > 1)
        );
      case "objectif":
        return (
          answers.objectifs.length > 0 &&
          (!answers.objectifs.includes("autre") ||
            answers.objectifCustom.trim().length > 1)
        );
      case "style":
        return !!answers.style;
      case "identite":
        return true;
      case "fonctionnalites":
        return true;
      case "contenu":
        return true;
      case "coordonnees":
        return (
          answers.entreprise.trim().length > 1 &&
          /.+@.+\..+/.test(answers.email)
        );
      default:
        return false;
    }
  }, [step, answers]);

  const goTo = (next: number) => {
    setDirection(next > stepIndex ? 1 : -1);
    setStepIndex(next);
  };

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) goTo(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
  };

  const toggleObjectif = (id: string) =>
    setAnswers((a) => ({
      ...a,
      objectifs: a.objectifs.includes(id)
        ? a.objectifs.filter((x) => x !== id)
        : [...a.objectifs, id],
    }));

  const toggleFonctionnalite = (id: string) =>
    setAnswers((a) => ({
      ...a,
      fonctionnalites: a.fonctionnalites.includes(id)
        ? a.fonctionnalites.filter((x) => x !== id)
        : [...a.fonctionnalites, id],
    }));

  const [logoError, setLogoError] = React.useState<string | null>(null);

  const handleLogoFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Format non supporté. Choisissez une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Fichier trop volumineux. 5 Mo maximum.");
      return;
    }
    setLogoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setAnswers((a) => ({
        ...a,
        logoName: file.name,
        logoPreview: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoError(null);
    setAnswers((a) => ({ ...a, logoName: "", logoPreview: "" }));
  };

  React.useEffect(() => {
    if (step !== "loading") return;
    setProgress(0);
    setDone(false);
    setSubmitError(null);
    setSubmitResult(false);
    setAccountExists(false);
    setRequiresLogin(false);
    setTempPassword(null);
    setPasswordCopied(false);
    const start = Date.now();
    const duration = 2800;
    let cancelled = false;

    const progressTimer = window.setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const pct = Math.min(95, Math.round((elapsed / duration) * 95));
      setProgress(pct);
    }, 40);

    (async () => {
      try {
        const res = await fetch("/api/questionnaire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSubmitError(data?.error || "Erreur lors de l'envoi.");
        } else if (data?.requiresLogin) {
          setRequiresLogin(true);
        } else {
          if (data?.accountExists) setAccountExists(true);
          if (data?.tempPassword) setTempPassword(data.tempPassword);
          setSubmitResult(true);
        }
      } catch {
        if (!cancelled) setSubmitError("Connexion impossible. Réessayez.");
      } finally {
        if (!cancelled) {
          window.clearInterval(progressTimer);
          setProgress(100);
          setDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(progressTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stepNumber = Math.min(stepIndex + 1, TOTAL_STEPS);
  const barProgress =
    step === "loading" ? 100 : (stepIndex / TOTAL_STEPS) * 100;

  return (
    <section
      id="questionnaire"
      aria-labelledby="questionnaire-title"
      className="py-24 sm:py-32"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Questionnaire</p>
          <h2
            id="questionnaire-title"
            className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Quelques minutes pour préparer votre site
          </h2>
          <p className="mt-4 text-muted-foreground">
            Répondez à cinq questions — chaque réponse peut être personnalisée
            librement. Notre moteur génère ensuite la structure, les balises et
            le contenu.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>
                {step === "loading"
                  ? "Finalisation"
                  : `Étape ${stepNumber} sur ${TOTAL_STEPS}`}
              </span>
              <span>{Math.round(barProgress)}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${barProgress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="relative min-h-[480px] px-6 py-10 sm:px-10">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === "metier" && (
                  <StepWrapper
                    title="Quel est votre métier ?"
                    subtitle="Sélectionnez votre domaine — ou décrivez-le si le vôtre ne figure pas dans la liste."
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {METIERS_POPULAR.map((m) => (
                        <OptionCard
                          key={m.id}
                          icon={m.icon}
                          label={m.label}
                          selected={answers.metier === m.id}
                          onClick={() =>
                            setAnswers((a) => ({ ...a, metier: m.id }))
                          }
                        />
                      ))}
                      <AnimatePresence initial={false}>
                        {showAllMetiers &&
                          METIERS_MORE.map((m) => (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ duration: 0.2 }}
                            >
                              <OptionCard
                                icon={m.icon}
                                label={m.label}
                                selected={answers.metier === m.id}
                                onClick={() =>
                                  setAnswers((a) => ({ ...a, metier: m.id }))
                                }
                              />
                            </motion.div>
                          ))}
                      </AnimatePresence>
                      <OptionCard
                        icon={Sparkles}
                        label="Autre"
                        description="Décrivez votre activité."
                        selected={answers.metier === "autre"}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, metier: "autre" }))
                        }
                      />
                    </div>

                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllMetiers((v) => !v)}
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {showAllMetiers
                          ? "Voir moins"
                          : "Voir plus de métiers"}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            showAllMetiers && "rotate-180"
                          )}
                          aria-hidden
                        />
                      </Button>
                    </div>

                    <AnimatePresence>
                      {answers.metier === "autre" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-1 pb-1 pt-6">
                            <label
                              htmlFor="metierCustom"
                              className="mb-1.5 block text-sm font-medium"
                            >
                              Précisez votre métier
                            </label>
                            <Input
                              id="metierCustom"
                              placeholder="Ex : torréfacteur artisanal, fleuriste, studio de podcast…"
                              value={answers.metierCustom}
                              onChange={(e) =>
                                setAnswers((a) => ({
                                  ...a,
                                  metierCustom: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </StepWrapper>
                )}

                {step === "objectif" && (
                  <StepWrapper
                    title="Quels sont vos objectifs ?"
                    subtitle="Sélectionnez un ou plusieurs objectifs. Les pages et appels à l'action seront calibrés en conséquence."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {OBJECTIFS.map((o) => (
                        <OptionCard
                          key={o.id}
                          icon={o.icon}
                          label={o.label}
                          description={o.description}
                          selected={answers.objectifs.includes(o.id)}
                          onClick={() => toggleObjectif(o.id)}
                        />
                      ))}
                      <OptionCard
                        icon={Sparkles}
                        label="Autre"
                        description="Un objectif spécifique ?"
                        selected={answers.objectifs.includes("autre")}
                        onClick={() => toggleObjectif("autre")}
                      />
                    </div>

                    <AnimatePresence>
                      {answers.objectifs.includes("autre") && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-1 pb-1 pt-6">
                            <label
                              htmlFor="objectifCustom"
                              className="mb-1.5 block text-sm font-medium"
                            >
                              Décrivez votre objectif
                            </label>
                            <Input
                              id="objectifCustom"
                              placeholder="Ex : organiser un événement, vendre un livre blanc…"
                              value={answers.objectifCustom}
                              onChange={(e) =>
                                setAnswers((a) => ({
                                  ...a,
                                  objectifCustom: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </StepWrapper>
                )}

                {step === "style" && (
                  <StepWrapper
                    title="Quel style préférez-vous ?"
                    subtitle="Typographie, couleurs et espaces seront ajustés à votre identité. Partagez aussi vos inspirations si vous en avez."
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      {STYLES.map((s) => (
                        <OptionCard
                          key={s.id}
                          icon={s.icon}
                          label={s.label}
                          description={s.description}
                          selected={answers.style === s.id}
                          onClick={() =>
                            setAnswers((a) => ({ ...a, style: s.id }))
                          }
                        />
                      ))}
                    </div>

                    <div className="mt-6">
                      <label
                        htmlFor="inspiration"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Inspirations{" "}
                        <span className="font-normal text-muted-foreground">
                          (optionnel)
                        </span>
                      </label>
                      <Textarea
                        id="inspiration"
                        placeholder="Partagez 2 ou 3 sites que vous aimez, une ambiance, des couleurs…"
                        value={answers.inspiration}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            inspiration: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </StepWrapper>
                )}

                {step === "identite" && (
                  <StepWrapper
                    title="Votre identité visuelle"
                    subtitle="Téléversez votre logo et choisissez votre couleur principale. Entièrement optionnel — nous en proposerons une si vous n'en avez pas."
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-medium">Logo</p>

                        {answers.logoPreview ? (
                          <div className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-muted/30 p-6">
                            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-background p-3 ring-1 ring-border/60">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={answers.logoPreview}
                                alt="Aperçu du logo"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {answers.logoName}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearLogo}
                              className="gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              Retirer
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor="logoUpload"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleLogoFile(e.dataTransfer.files?.[0]);
                            }}
                            className={cn(
                              "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-10 text-center transition-colors",
                              "hover:border-primary/50 hover:bg-muted/40"
                            )}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                              <Upload className="h-5 w-5" aria-hidden />
                            </span>
                            <span className="text-sm font-medium">
                              Glissez votre logo ici
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ou cliquez pour parcourir · PNG, JPG, SVG · 5 Mo
                            </span>
                          </label>
                        )}

                        <input
                          id="logoUpload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) =>
                            handleLogoFile(e.target.files?.[0])
                          }
                        />

                        {logoError && (
                          <p
                            role="alert"
                            className="mt-2 text-xs font-medium text-red-500"
                          >
                            {logoError}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium">
                          Couleur principale
                        </p>

                        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <label
                            htmlFor="couleurPicker"
                            className="relative flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border shadow-inner"
                            style={{ backgroundColor: answers.couleur }}
                            aria-label="Sélecteur de couleur"
                          >
                            <input
                              id="couleurPicker"
                              type="color"
                              value={answers.couleur}
                              onChange={(e) =>
                                setAnswers((a) => ({
                                  ...a,
                                  couleur: e.target.value,
                                }))
                              }
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                          </label>
                          <div className="flex-1">
                            <Input
                              aria-label="Valeur hexadécimale"
                              value={answers.couleur.toUpperCase()}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (/^#?[0-9A-Fa-f]{0,6}$/.test(v)) {
                                  setAnswers((a) => ({
                                    ...a,
                                    couleur: v.startsWith("#") ? v : `#${v}`,
                                  }));
                                }
                              }}
                              className="h-10 font-mono text-sm uppercase"
                              maxLength={7}
                            />
                          </div>
                        </div>

                        <div
                          role="radiogroup"
                          aria-label="Couleurs prédéfinies"
                          className="mt-4 flex flex-wrap gap-2"
                        >
                          {COLOR_PRESETS.map((c) => {
                            const active =
                              answers.couleur.toLowerCase() ===
                              c.hex.toLowerCase();
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                aria-label={c.name}
                                onClick={() =>
                                  setAnswers((a) => ({
                                    ...a,
                                    couleur: c.hex,
                                  }))
                                }
                                className={cn(
                                  "relative h-9 w-9 rounded-full border-2 transition-all",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                  active
                                    ? "scale-110 border-foreground shadow-md"
                                    : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: c.hex }}
                              />
                            );
                          })}
                        </div>

                        <p className="mt-4 text-xs text-muted-foreground">
                          Cette couleur servira de fil conducteur aux boutons,
                          liens et accents graphiques du site.
                        </p>
                      </div>
                    </div>
                  </StepWrapper>
                )}

                {step === "fonctionnalites" && (
                  <StepWrapper
                    title="Quelles fonctionnalités souhaitez-vous ?"
                    subtitle="Sélectionnez toutes celles qui vous intéressent — ou passez cette étape, nous adapterons en fonction de votre métier."
                  >
                    <div className="flex flex-wrap gap-2">
                      {FONCTIONNALITES.map((f) => {
                        const selected = answers.fonctionnalites.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleFonctionnalite(f.id)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50"
                            )}
                          >
                            <f.icon className="h-4 w-4" aria-hidden />
                            {f.label}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-6 text-xs text-muted-foreground">
                      Besoin d&apos;une fonctionnalité spécifique ? Mentionnez-la à
                      l&apos;étape suivante dans le champ « votre projet ».
                    </p>
                  </StepWrapper>
                )}

                {step === "contenu" && (
                  <StepWrapper
                    title="Du contenu à importer ?"
                    subtitle="Si vous avez déjà une présence en ligne, nous pouvons récupérer vos textes, photos et avis automatiquement. Tous les champs sont facultatifs."
                  >
                    <div className="space-y-4">
                      <UrlField
                        id="siteActuel"
                        label="Site web actuel"
                        placeholder="https://votre-entreprise.fr"
                        icon={Globe}
                        value={answers.siteActuel}
                        onChange={(v) =>
                          setAnswers((a) => ({ ...a, siteActuel: v }))
                        }
                      />
                      <UrlField
                        id="googleBusiness"
                        label="Google My Business"
                        placeholder="https://g.page/votre-etablissement"
                        icon={MapPin}
                        value={answers.googleBusiness}
                        onChange={(v) =>
                          setAnswers((a) => ({ ...a, googleBusiness: v }))
                        }
                      />
                      <UrlField
                        id="instagram"
                        label="Instagram"
                        placeholder="@votre_compte"
                        icon={Instagram}
                        value={answers.instagram}
                        onChange={(v) =>
                          setAnswers((a) => ({ ...a, instagram: v }))
                        }
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <UrlField
                          id="facebook"
                          label="Facebook"
                          placeholder="facebook.com/votre-page"
                          icon={Facebook}
                          value={answers.facebook}
                          onChange={(v) =>
                            setAnswers((a) => ({ ...a, facebook: v }))
                          }
                        />
                        <UrlField
                          id="linkedin"
                          label="LinkedIn"
                          placeholder="linkedin.com/company/…"
                          icon={Linkedin}
                          value={answers.linkedin}
                          onChange={(v) =>
                            setAnswers((a) => ({ ...a, linkedin: v }))
                          }
                        />
                      </div>

                      <p className="pt-2 text-xs text-muted-foreground">
                        Nous importerons automatiquement vos textes, photos et
                        avis clients si vous nous fournissez ces liens. Aucun
                        accès n&apos;est requis.
                      </p>
                    </div>
                  </StepWrapper>
                )}

                {step === "coordonnees" && (
                  <StepWrapper
                    title="Vos coordonnées"
                    subtitle="Nous vous enverrons la maquette personnalisée sous 24h."
                  >
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (canAdvance) handleNext();
                      }}
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="entreprise"
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Nom de l&apos;entreprise
                          </label>
                          <Input
                            id="entreprise"
                            name="entreprise"
                            autoComplete="organization"
                            placeholder="Atelier Rivière"
                            value={answers.entreprise}
                            onChange={(e) =>
                              setAnswers((a) => ({
                                ...a,
                                entreprise: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Email professionnel
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="contact@votre-entreprise.fr"
                            value={answers.email}
                            onChange={(e) =>
                              setAnswers((a) => ({ ...a, email: e.target.value }))
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="telephone"
                          className="mb-1.5 block text-sm font-medium"
                        >
                          Téléphone{" "}
                          <span className="font-normal text-muted-foreground">
                            (optionnel)
                          </span>
                        </label>
                        <Input
                          id="telephone"
                          name="telephone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="06 12 34 56 78"
                          value={answers.telephone}
                          onChange={(e) =>
                            setAnswers((a) => ({
                              ...a,
                              telephone: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="message"
                          className="mb-1.5 block text-sm font-medium"
                        >
                          Parlez-nous de votre projet{" "}
                          <span className="font-normal text-muted-foreground">
                            (optionnel)
                          </span>
                        </label>
                        <Textarea
                          id="message"
                          placeholder="Un contexte, une contrainte, une fonctionnalité particulière…"
                          value={answers.message}
                          onChange={(e) =>
                            setAnswers((a) => ({
                              ...a,
                              message: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vos données restent strictement confidentielles.
                      </p>
                    </form>
                  </StepWrapper>
                )}

                {step === "loading" && (
                  <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                    {!done ? (
                      <>
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                          <Loader2 className="relative h-8 w-8 animate-spin text-primary" />
                        </div>
                        <h3 className="mt-6 text-xl font-semibold tracking-tight">
                          Génération de votre structure SEO…
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          Analyse du métier, construction des balises, des
                          données structurées et du sitemap.
                        </p>
                        <div className="mt-8 h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1, ease: "linear" }}
                          />
                        </div>
                        <p className="mt-3 text-xs font-medium tabular-nums text-muted-foreground">
                          {progress}%
                        </p>
                      </>
                    ) : submitError ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                          <Loader2 className="h-8 w-8" aria-hidden />
                        </span>
                        <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                          Un problème est survenu
                        </h3>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                          {submitError}
                        </p>
                        <Button
                          className="mt-8"
                          size="lg"
                          onClick={() => goTo(STEPS.indexOf("coordonnees"))}
                        >
                          Réessayer
                        </Button>
                      </motion.div>
                    ) : requiresLogin ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                          <Lock className="h-8 w-8" aria-hidden />
                        </span>
                        <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                          Connexion requise
                        </h3>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                          L&apos;adresse{" "}
                          <span className="font-medium text-foreground">
                            {answers.email}
                          </span>{" "}
                          est déjà associée à un compte ou à une demande
                          existante. Connectez-vous pour soumettre une nouvelle
                          demande.
                        </p>
                        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                          <Button size="lg" asChild>
                            <a href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + "#questionnaire" : "/")}`}>
                              Se connecter
                            </a>
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => goTo(STEPS.indexOf("coordonnees"))}
                          >
                            Modifier l&apos;email
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex w-full flex-col items-center"
                      >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckCircle2 className="h-8 w-8" aria-hidden />
                        </span>
                        <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                          Votre demande est enregistrée.
                        </h3>

                        {accountExists ? (
                          <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Votre nouvelle demande a bien été reçue. Retrouvez
                            le suivi depuis votre espace client.
                          </p>
                        ) : (
                          <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Nous avons préparé une maquette sur-mesure pour{" "}
                            <span className="font-medium text-foreground">
                              {answers.entreprise || "votre entreprise"}
                            </span>
                            . Votre espace client est prêt — connectez-vous
                            avec les identifiants ci-dessous.
                          </p>
                        )}

                        {tempPassword && (
                          <div className="mt-6 w-full max-w-sm rounded-xl border border-border bg-muted/50 p-4 text-left">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Vos identifiants de connexion
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 text-sm">
                                <span className="truncate text-muted-foreground">
                                  {answers.email}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 text-sm">
                                <span className="font-mono tracking-wide">
                                  {tempPassword}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tempPassword);
                                    setPasswordCopied(true);
                                    setTimeout(() => setPasswordCopied(false), 2000);
                                  }}
                                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  {passwordCopied ? "Copié ✓" : "Copier"}
                                </button>
                              </div>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                              Vous devrez choisir un nouveau mot de passe à la
                              première connexion.
                            </p>
                          </div>
                        )}

                        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                          {accountExists ? (
                            sessionStatus === "authenticated" ? (
                              <Button size="lg" asChild>
                                <a href="/portal">Accéder à mon espace</a>
                              </Button>
                            ) : (
                              <Button size="lg" asChild>
                                <a href="/login">Se connecter à mon espace</a>
                              </Button>
                            )
                          ) : (
                            <Button size="lg" asChild>
                              <a href="/login">Se connecter</a>
                            </Button>
                          )}
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => {
                              setAnswers(EMPTY);
                              goTo(0);
                            }}
                          >
                            Configurer un autre site
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {step !== "loading" && (
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-6 py-4 sm:px-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={stepIndex === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canAdvance}
                className="gap-2"
              >
                {stepIndex === TOTAL_STEPS - 1
                  ? "Générer mon site"
                  : "Continuer"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StepWrapper({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="mb-6">
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}

function UrlField({
  id,
  label,
  placeholder,
  icon: Icon,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium"
      >
        {label}{" "}
        <span className="font-normal text-muted-foreground">(optionnel)</span>
      </label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
        >
          <Icon className="h-4 w-4" />
        </span>
        <Input
          id={id}
          inputMode="url"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}

function OptionCard({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
          : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/50"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}
