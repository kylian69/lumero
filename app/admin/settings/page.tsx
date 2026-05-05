import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettings } from "@/components/account/account-settings";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
  });
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Mon compte"
        description={`Administrateur depuis le ${formatDate(user.createdAt)}.`}
      />
      <AccountSettings
        user={{
          id: user.id,
          email: user.email,
          pendingEmail: user.pendingEmail,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          avatarUrl: user.avatarUrl,
          twoFactorEnabled: user.twoFactorEnabled,
        }}
      />
    </div>
  );
}
