import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/session";
import { UsersManager, type ManagedUser } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      invitations: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true },
        take: 1,
      },
    },
  });

  const managed: ManagedUser[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    pendingInvite: u.invitations.length > 0,
  }));

  return (
    <div>
      <PageHeader
        title="Équipe & utilisateurs"
        description="Créez, modifiez, invitez ou supprimez les comptes (administrateurs et clients)."
      />
      <UsersManager initialUsers={managed} currentUserId={session.id} />
    </div>
  );
}
