import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import {
  ensureProvisioned,
  previewHostnameForProject,
  previewUrlForProject,
  startPreview,
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
      { error: "Projet non provisionné. Lancez d'abord le provisioning GitHub." },
      { status: 409 }
    );
  }

  await ensureProvisioned({
    id: project.id,
    slug: project.slug,
    hostname: previewHostnameForProject(project.slug, project.id),
    githubRepoFullName: `${process.env.GITHUB_ORG}/${project.githubRepoName}`,
    githubBranch: project.githubPreviewBranch,
  });

  const preview = await startPreview(project.id);
  const updated = await prisma.project.update({
    where: { id },
    data: {
      previewStatus: preview.state,
      previewUrl: previewUrlForProject(project.slug, project.id),
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_started",
  });

  return NextResponse.json({ ok: true, project: updated, state: preview.state });
}
