import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getPreview } from "@/lib/preview-orchestrator";

export async function GET(
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
    return NextResponse.json({ state: "NONE", url: null });
  }

  const preview = await getPreview(project.id);
  return NextResponse.json({
    state: preview?.state ?? "NONE",
    url: project.previewUrl,
    lastBuiltAt: preview?.lastBuiltAt ?? null,
    errorMessage: preview?.errorMessage ?? null,
  });
}
