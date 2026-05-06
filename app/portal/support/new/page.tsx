import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewTicketForm } from "@/components/portal/new-ticket-form";

export const dynamic = "force-dynamic";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; subject?: string; projectId?: string }>;
}) {
  const session = await getSession();
  const userId = session!.user.id;
  const { topic, subject, projectId } = await searchParams;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const defaultProjectId =
    projectId && projects.some((p) => p.id === projectId)
      ? projectId
      : projects[0]?.id;

  return (
    <div>
      <PageHeader
        title="Nouveau ticket"
        description="Posez votre question ou décrivez votre souci. On vous répond vite."
        breadcrumbs={[
          { label: "Espace", href: "/portal" },
          { label: "Support", href: "/portal/support" },
          { label: "Nouveau" },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/support">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
          </Button>
        }
      />
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Votre demande</CardTitle>
          </CardHeader>
          <CardContent>
            <NewTicketForm
              initialCategory={topic || "AUTRE"}
              initialSubject={subject || ""}
              projects={projects}
              defaultProjectId={defaultProjectId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
