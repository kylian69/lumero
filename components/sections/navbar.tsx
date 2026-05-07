"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#modeles", label: "Modèles" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#a-propos", label: "À propos" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { data: session, status } = useSession();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  const accountHref =
    session?.user?.role === "ADMIN" ? "/admin" : "/portal";
  const isAuthed = status === "authenticated";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-background/70 border-b border-border/60"
          : "bg-transparent"
      )}
    >
      <nav
        aria-label="Navigation principale"
        className="container flex h-16 items-center justify-between"
      >
        <Link href="/" aria-label="Accueil Lumero">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {isAuthed ? (
            <Button asChild size="sm" variant="outline">
              <Link href={accountHref}>
                <UserCircle className="h-4 w-4" />
                Mon espace
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link href="/login">Se connecter</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <a href="#questionnaire">Démarrer mon projet</a>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border/60 bg-background/95 backdrop-blur md:hidden"
        >
          <ul className="container flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              {isAuthed ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={accountHref} onClick={() => setOpen(false)}>
                    <UserCircle className="h-4 w-4" />
                    Mon espace
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Se connecter
                  </Link>
                </Button>
              )}
            </li>
            <li>
              <Button asChild className="w-full">
                <a href="#questionnaire" onClick={() => setOpen(false)}>
                  Démarrer mon projet
                </a>
              </Button>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  );
}
