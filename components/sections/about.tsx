"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Clock, Sparkles } from "lucide-react";

const PILLARS = [
  {
    icon: Clock,
    title: "24h chrono",
    description:
      "Un engagement ferme : votre site en production sous 24 heures ouvrées, sans friction.",
  },
  {
    icon: ShieldCheck,
    title: "Hébergement souverain",
    description:
      "Infrastructure européenne, performances de premier ordre et conformité RGPD native.",
  },
  {
    icon: Sparkles,
    title: "SEO par défaut",
    description:
      "Structure sémantique, balises optimisées, sitemap dynamique et données structurées incluses.",
  },
];

export function About() {
  return (
    <section
      id="a-propos"
      aria-labelledby="about-title"
      className="py-24 sm:py-32 bg-gradient-to-b from-transparent via-muted/30 to-transparent"
    >
      <div className="container grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium text-primary">À propos</p>
          <h2
            id="about-title"
            className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Nous créons des sites qui travaillent pour vous.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Lumero rassemble des experts en design produit, ingénierie web et SEO.
            Nous combinons des modèles rigoureusement conçus à une automatisation
            intelligente pour livrer des sites qui convertissent, sans compromis
            sur la qualité.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Notre mission : éliminer la complexité technique pour que vous
            puissiez vous concentrer sur ce qui compte vraiment — votre métier.
          </p>
        </div>

        <ul className="space-y-4">
          {PILLARS.map((pillar, i) => (
            <motion.li
              key={pillar.title}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <pillar.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold tracking-tight">
                  {pillar.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
