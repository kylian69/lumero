import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell, type NavItem } from "@/components/shared/app-shell";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login?next=/portal");
  if (session.user.role === "ADMIN") redirect("/admin");

  const openTickets = await prisma.supportTicket.count({
    where: {
      authorId: session.user.id,
      status: { in: ["OPEN", "WAITING_STAFF", "WAITING_CLIENT"] },
    },
  });

  const items: NavItem[] = [
    {
      label: "Accueil",
      href: "/portal",
      icon: "LayoutDashboard",
      exact: true,
    },
    { label: "Mes sites", href: "/portal/project", icon: "Globe" },
    {
      label: "Personnalisations",
      href: "/portal/customization",
      icon: "Sparkles",
    },
    { label: "Abonnement", href: "/portal/subscription", icon: "CreditCard" },
    { label: "Facturation", href: "/portal/billing", icon: "Receipt" },
    {
      label: "Support",
      href: "/portal/support",
      icon: "LifeBuoy",
      badge: openTickets || undefined,
    },
    { label: "Mon profil", href: "/portal/profile", icon: "UserCircle" },
  ];

  return (
    <AppShell items={items} title="Espace client">
      {children}
    </AppShell>
  );
}

