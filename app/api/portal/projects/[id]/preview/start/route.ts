import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { startPreview, previewUrlForProject } from "@/lib/preview-orchestrator";
import {
  PORTAL_PREVIEW_DAILY_START_LIMIT,
  countPortalStartsLast24h,
} from "@/lib/preview-quota";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (!project.githubRepoName) {
    return NextResponse.json(
      { error: "Cette preview n'est pas encore prête. Contactez le support." },
      { status: 422 }
    );
  }

  // Enforce daily start quota for client-initiated starts.
  const used = await countPortalStartsLast24h(project.id, session.user.id);
  if (used >= PORTAL_PREVIEW_DAILY_START_LIMIT) {
    return NextResponse.json(
      {
        error: `Limite quotidienne atteinte (${PORTAL_PREVIEW_DAILY_START_LIMIT} démarrages par 24h). Vous pourrez démarrer à nouveau plus tard.`,
        quota: {
          limit: PORTAL_PREVIEW_DAILY_START_LIMIT,
          used,
          remaining: 0,
        },
      },
      { status: 429 }
    );
  }

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
    entityId: project.id,
    action: "preview_started_portal",
  });

  return NextResponse.json({
    ok: true,
    project: updated,
    state: preview.state,
    quota: {
      limit: PORTAL_PREVIEW_DAILY_START_LIMIT,
      used: used + 1,
      remaining: PORTAL_PREVIEW_DAILY_START_LIMIT - used - 1,
    },
  });
}
