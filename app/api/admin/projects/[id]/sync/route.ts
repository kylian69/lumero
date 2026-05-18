import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import {
  getPreview,
  previewUrlForProject,
  mapStateToPreviewStatus,
} from "@/lib/preview-orchestrator";

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
  if (!project.githubRepoName) {
    return NextResponse.json(
      { error: "Projet non provisionné. Cliquez d'abord sur Configurer." },
      { status: 422 }
    );
  }

  const preview = await getPreview(project.id);
  if (!preview) {
    return NextResponse.json(
      { error: "Preview introuvable côté orchestrateur." },
      { status: 404 }
    );
  }

  // The public URL is deterministic from the slug; we still refresh it in DB
  // in case the slug changed (it shouldn't).
  const url = previewUrlForProject(project.slug, project.id);
  const status = mapStateToPreviewStatus(preview.state);

  const updated = await prisma.project.update({
    where: { id },
    data: { previewUrl: url, previewStatus: status },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_synced",
    metadata: { previewUrl: url, state: preview.state },
  });

  return NextResponse.json({
    ok: true,
    project: updated,
    state: preview.state,
    lastBuiltAt: preview.lastBuiltAt,
    lastBuiltSha: preview.lastBuiltSha,
    errorMessage: preview.errorMessage,
  });
}
