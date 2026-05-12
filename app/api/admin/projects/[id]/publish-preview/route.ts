import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { previewPublishedTemplate } from "@/lib/email/templates";
import { startPreview, previewUrlForSlug } from "@/lib/preview-orchestrator";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true, firstName: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (!project.githubRepoName) {
    return NextResponse.json(
      { error: "Projet non provisionné. Cliquez d'abord sur Configurer." },
      { status: 422 }
    );
  }

  // Ensure the preview is running before notifying the client. The
  // orchestrator's `start` is idempotent; it builds the image on first call
  // if needed.
  try {
    await startPreview(project.id);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Impossible de démarrer la preview côté orchestrateur. " +
          (err instanceof Error ? err.message : ""),
      },
      { status: 502 }
    );
  }

  const previewUrl = previewUrlForSlug(project.slug);

  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: "REVIEW",
      previewStatus: "REVIEW_SENT",
      previewPublishedAt: new Date(),
      previewUrl,
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_published",
    metadata: { previewUrl },
  });

  const clientName = project.user.firstName ?? project.user.name ?? null;
  const tpl = previewPublishedTemplate({
    clientName,
    projectName: project.name,
    previewUrl,
  });
  await sendEmail({ to: project.user.email, ...tpl });

  return NextResponse.json({ ok: true, project: updated });
}
