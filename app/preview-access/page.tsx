import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canAccessPreview } from "@/lib/preview-access";
import { previewUrlForProject } from "@/lib/preview-orchestrator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestAccessButton } from "@/components/preview/request-access-button";

export const dynamic = "force-dynamic";

export default async function PreviewAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;
  if (!projectId) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, slug: true },
  });
  if (!project) notFound();

  const session = await getSession();

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Accès à la preview</CardTitle>
          <CardDescription>{project.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );

  // Pas connecté → inviter à se connecter, retour sur cette page ensuite.
  if (!session?.user) {
    const next = `/preview-access?project=${encodeURIComponent(project.id)}`;
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Cette preview est privée. Connectez-vous pour y accéder ou demander une
          autorisation.
        </p>
        <Button asChild className="w-full">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Se connecter</Link>
        </Button>
      </Shell>
    );
  }

  const allowed = await canAccessPreview(
    { id: session.user.id, role: session.user.role },
    project.id
  );

  if (allowed) {
    const url = previewUrlForProject(project.slug, project.id);
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Vous avez accès à cette preview.
        </p>
        <Button asChild className="w-full">
          <a href={url}>Ouvrir la preview</a>
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-sm text-muted-foreground">
        Vous n'êtes pas autorisé à voir cette preview. Vous pouvez demander
        l'accès : un administrateur examinera votre demande.
      </p>
      <RequestAccessButton projectId={project.id} />
    </Shell>
  );
}
