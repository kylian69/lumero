import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import {
  createGithubRepo,
  createGithubBranch,
  createGithubWebhook,
} from "@/lib/github";
import {
  provisionPreview,
  previewUrlForSlug,
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
  if (project.githubRepoName) {
    return NextResponse.json({ error: "Déjà provisionné" }, { status: 409 });
  }

  // 1. Create GitHub repo (auto-initializes main branch)
  const { repoName, repoUrl, fullName } = await createGithubRepo(project.slug);

  // 2. Create the preview branch from main
  await createGithubBranch(fullName, project.githubPreviewBranch);

  // 3. Register a push webhook so the orchestrator rebuilds on commits.
  //    Only if both PREVIEW_WEBHOOK_URL and PREVIEW_GITHUB_WEBHOOK_SECRET are
  //    configured — otherwise skip silently (e.g. local dev).
  const webhookUrl = process.env.PREVIEW_WEBHOOK_URL;
  const webhookSecret = process.env.PREVIEW_GITHUB_WEBHOOK_SECRET;
  if (webhookUrl && webhookSecret) {
    try {
      await createGithubWebhook(fullName, webhookUrl, webhookSecret);
    } catch (err) {
      console.warn("[provision] GitHub webhook registration failed (non-fatal):", err);
    }
  }

  // 4. Register the preview with the orchestrator (no container yet).
  await provisionPreview({
    id: project.id,
    slug: project.slug,
    githubRepoFullName: fullName,
    githubBranch: project.githubPreviewBranch,
  });

  // 5. Persist in DB
  const updated = await prisma.project.update({
    where: { id },
    data: {
      githubRepoName: repoName,
      githubRepoUrl: repoUrl,
      previewStatus: "STOPPED",
      previewUrl: previewUrlForSlug(project.slug),
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "provisioned",
    metadata: { githubRepoUrl: repoUrl },
  });

  return NextResponse.json({
    ok: true,
    githubRepoUrl: repoUrl,
    project: updated,
  });
}
