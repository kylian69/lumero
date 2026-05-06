import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { getLatestPreviewDeployment } from "@/lib/vercel";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (!project.vercelProjectId) {
    return NextResponse.json(
      { error: "Projet non provisionné. Cliquez d'abord sur Configurer." },
      { status: 422 }
    );
  }

  const deployment = await getLatestPreviewDeployment(project.vercelProjectId);

  if (!deployment) {
    return NextResponse.json(
      { error: "Aucun déploiement de la branche preview trouvé. Avez-vous bien poussé du code ?" },
      { status: 404 }
    );
  }

  if (deployment.state !== "READY") {
    return NextResponse.json({
      ok: false,
      state: deployment.state,
      message: `Déploiement en état: ${deployment.state}. Réessayez dans quelques instants.`,
    });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      previewUrl: deployment.url,
      previewStatus: project.previewStatus === "REVIEW_SENT" ? "REVIEW_SENT" : "READY",
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_synced",
    metadata: { previewUrl: deployment.url },
  });

  return NextResponse.json({ ok: true, project: updated });
}
