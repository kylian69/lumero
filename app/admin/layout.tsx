import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell, type NavItem } from "@/components/shared/app-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  const [newProspects, openTickets, pendingCustomizations] = await Promise.all([
    prisma.prospect.count({ where: { status: "NEW" } }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "WAITING_STAFF"] } },
    }),
    prisma.customizationRequest.count({
      where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } },
    }),
  ]);

  const items: NavItem[] = [
    {
      label: "Tableau de bord",
      href: "/admin",
      icon: "LayoutDashboard",
      exact: true,
    },
    {
      label: "Prospects",
      href: "/admin/prospects",
      icon: "Mailbox",
      badge: newProspects || undefined,
    },
    { label: "Clients", href: "/admin/clients", icon: "Users" },
    {
      label: "Personnalisations",
      href: "/admin/customizations",
      icon: "Sparkles",
      badge: pendingCustomizations || undefined,
    },
    {
      label: "Support",
      href: "/admin/support",
      icon: "LifeBuoy",
      badge: openTickets || undefined,
    },
    { label: "Facturation", href: "/admin/billing", icon: "Receipt" },
    { label: "Utilisateurs", href: "/admin/team", icon: "UserCog" },
    { label: "Journaux", href: "/admin/logs", icon: "ScrollText" },
    { label: "Mon compte", href: "/admin/settings", icon: "UserCircle" },
  ];

  return (
    <AppShell items={items} title="Console admin">
      {children}
    </AppShell>
  );
}

