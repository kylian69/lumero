import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CustomizationThread } from "@/components/shared/customization-thread";

export const dynamic = "force-dynamic";

export default async function PortalCustomizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const request = await prisma.customizationRequest.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { name: true, email: true, role: true } },
          attachments: {
            select: { id: true, filename: true, mimeType: true, size: true },
          },
        },
      },
    },
  });
  if (!request) notFound();

  return (
    <div>
      <PageHeader
        title={request.title}
        breadcrumbs={[
          { label: "Espace", href: "/portal" },
          { label: "Personnalisations", href: "/portal/customization" },
          { label: request.title },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/customization">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
        }
      />
      <CustomizationThread
        requestId={request.id}
        title={request.title}
        status={request.status}
        priority={request.priority}
        category={request.category}
        messages={request.messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          editedAt: m.editedAt,
          deletedAt: m.deletedAt,
          authorId: m.authorId,
          author: {
            name: m.author.name,
            email: m.author.email,
            role: m.author.role,
          },
          attachments: m.attachments,
        }))}
        scope="portal"
        currentUserId={session!.user.id}
      />
    </div>
  );
}
