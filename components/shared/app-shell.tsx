"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Mailbox,
  LifeBuoy,
  UserCog,
  Sparkles,
  Globe,
  CreditCard,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Mailbox,
  LifeBuoy,
  UserCog,
  Sparkles,
  Globe,
  CreditCard,
  UserCircle,
};

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
  exact?: boolean;
};

export function AppShell({
  items,
  title,
  children,
}: {
  items: NavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="inline-flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border/60 bg-background transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="hidden items-center gap-2 px-6 py-6 md:flex">
              <Link href="/" className="inline-flex items-center gap-2">
                <Logo />
              </Link>
            </div>
            <div className="px-4 pb-2 pt-2 md:pt-0">
              <p className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1 px-4">
              {items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = iconMap[item.icon] || LayoutDashboard;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border/60 p-4">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {(session?.user?.name || session?.user?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {session?.user?.name || "Utilisateur"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex-1 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay on mobile */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="min-h-screen flex-1">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
