import Link from "next/link";
import { Linkedin } from "lucide-react";
import { Logo } from "@/components/logo";
import { METIERS } from "@/lib/metiers-data";
import { ManageCookiesLink } from "@/components/cookie-consent/manage-cookies-link";
import { VersionTag } from "@/components/sections/version-tag";

export function Footer() {
  return (
    <>
    <footer className="border-t border-border/60 py-12">
      <div className="container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Website-as-a-Service. Déployez. Brillez.
          </p>
          <a
            href="https://www.linkedin.com/company/lumero-fr"
            target="_blank"
            rel="noopener"
            aria-label="Lumero sur LinkedIn"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Linkedin className="h-4 w-4" aria-hidden="true" />
            LinkedIn
          </a>
        </div>
        <nav aria-label="Pied de page">
          <ul className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <li>
              <a href="#modeles" className="hover:text-foreground">
                Modèles
              </a>
            </li>
            <li>
              <a href="#tarifs" className="hover:text-foreground">
                Tarifs
              </a>
            </li>
            <li>
              <a href="#a-propos" className="hover:text-foreground">
                À propos
              </a>
            </li>
            <li>
              <Link href="/faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
            <li>
              <a href="#contact" className="hover:text-foreground">
                Contact
              </a>
            </li>
            <li>
              <Link href="/mentions-legales" className="hover:text-foreground">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/politique-confidentialite" className="hover:text-foreground">
                Confidentialité
              </Link>
            </li>
            <ManageCookiesLink />
          </ul>
        </nav>
      </div>
      <nav aria-label="Sites par métier" className="container mt-10">
        <h2 className="text-sm font-medium text-foreground">
          Création de site internet par métier
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {METIERS.map((m) => (
            <li key={m.slug}>
              <Link href={`/${m.slug}`} className="hover:text-foreground">
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="container mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumero. Tous droits réservés.
      </p>
    </footer>
    <VersionTag />
    </>
  );
}
