import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketThread } from "@/components/shared/ticket-thread";
import { AdminPreviewAccess } from "@/components/preview/admin-preview-access";
import { formatTicketNumber } from "@/lib/ticket-number";

export const dynamic = "force-dynamic";

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true, phone: true },
      },
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
  if (!ticket) notFound();

  return (
    <div>
      <PageHeader
        title={`Ticket ${formatTicketNumber(ticket.number)}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Support", href: "/admin/support" },
          { label: `${formatTicketNumber(ticket.number)} · ${ticket.subject}` },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/support">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TicketThread
            ticketId={ticket.id}
            subject={ticket.subject}
            status={ticket.status}
            priority={ticket.priority}
            category={ticket.category}
            messages={ticket.messages.map((m) => ({
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
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Auteur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">{ticket.author.name || "—"}</p>
              <a
                href={`mailto:${ticket.author.email}`}
                className="block text-xs text-primary hover:underline"
              >
                {ticket.author.email}
              </a>
              {ticket.author.phone && (
                <a
                  href={`tel:${ticket.author.phone}`}
                  className="block text-xs text-primary hover:underline"
                >
                  {ticket.author.phone}
                </a>
              )}
              <Link
                href={`/admin/clients/${ticket.author.id}`}
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Voir la fiche client →
              </Link>
            </CardContent>
          </Card>

          {ticket.project && (
            <div className="mt-6">
              <AdminPreviewAccess
                projectId={ticket.project.id}
                defaultEmail={
                  ticket.category === "PREVIEW_ACCESS"
                    ? ticket.author.email
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
