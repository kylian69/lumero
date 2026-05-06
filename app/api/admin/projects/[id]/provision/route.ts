import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { createGithubRepo, createGithubBranch } from "@/lib/github";
import { createVercelProject, registerVercelWebhook } from "@/lib/vercel";

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

  // 2. Create preview branch from main
  await createGithubBranch(fullName, project.githubPreviewBranch);

  // 3. Create Vercel project linked to GitHub repo
  const { projectId: vercelProjectId } = await createVercelProject(project.slug, fullName);

  // 4. Register Vercel webhook (only if APP_URL is a public HTTPS URL)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl.startsWith("https://")) {
    try {
      await registerVercelWebhook(vercelProjectId);
    } catch (err) {
      console.warn("[provision] Webhook registration failed (non-fatal):", err);
    }
  } else {
    console.info("[provision] Skipping webhook registration — NEXT_PUBLIC_APP_URL is not a public HTTPS URL.");
  }

  // 5. Persist in DB
  const updated = await prisma.project.update({
    where: { id },
    data: {
      githubRepoName: repoName,
      githubRepoUrl: repoUrl,
      vercelProjectId,
      previewStatus: "PROVISIONING",
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "provisioned",
    metadata: { githubRepoUrl: repoUrl, vercelProjectId },
  });

  return NextResponse.json({
    ok: true,
    githubRepoUrl: repoUrl,
    vercelProjectId,
    project: updated,
  });
}
