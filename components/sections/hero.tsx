"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="container relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          Website-as-a-Service · Livré en 24h
        </motion.div>

        <motion.h1
          id="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
        >
          Votre site internet professionnel,{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-primary bg-clip-text text-transparent">
            livré en 24h.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl"
        >
          Lumero crée, héberge et référence votre site vitrine professionnel en
          moins de 24 heures. Modèles métier, SEO inclus, performance optimisée.
          À partir de 99€.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="group relative overflow-hidden">
            <a href="#questionnaire">
              <span className="relative z-10 flex items-center gap-2">
                Démarrer mon projet
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#modeles">Voir les modèles</a>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          Sans engagement · Hébergement inclus · Mise à jour illimitée
        </motion.p>
      </div>
    </section>
  );
}
