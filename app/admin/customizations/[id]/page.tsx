import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomizationControls } from "@/components/admin/customization-controls";
import { CustomizationThread } from "@/components/shared/customization-thread";

export const dynamic = "force-dynamic";

export default async function AdminCustomizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const request = await prisma.customizationRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      messages: {
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
          { label: "Admin", href: "/admin" },
          { label: "Personnalisations", href: "/admin/customizations" },
          { label: request.title },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/customizations">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustomizationThread
            requestId={request.id}
            title={request.title}
            status={request.status}
            priority={request.priority}
            category={request.category}
            messages={request.messages.map((m) => ({
              id: m.id,
              content: m.content,
              isInternal: m.isInternal,
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
            scope="admin"
            allowStatusChange
            currentUserId={session!.user.id}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">{request.user.name || "—"}</p>
              <a
                href={`mailto:${request.user.email}`}
                className="block text-xs text-primary hover:underline"
              >
                {request.user.email}
              </a>
              <Link
                href={`/admin/clients/${request.user.id}`}
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Voir la fiche client →
              </Link>
              {request.project && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Projet : {request.project.name}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomizationControls
                id={request.id}
                status={request.status}
                priority={request.priority}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
