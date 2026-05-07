import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Website-as-a-Service. Déployez. Brillez.
          </p>
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
              <a href="/faq" className="hover:text-foreground">
                FAQ
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-foreground">
                Contact
              </a>
            </li>
            <li>
              <a href="/mentions-legales" className="hover:text-foreground">
                Mentions légales
              </a>
            </li>
            <li>
              <a href="/politique-confidentialite" className="hover:text-foreground">
                Confidentialité
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <p className="container mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumero. Tous droits réservés.
      </p>
    </footer>
  );
}
