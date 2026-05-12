import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stopPreview } from "@/lib/preview-orchestrator";

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
    return NextResponse.json({ error: "Preview non provisionnée" }, { status: 422 });
  }

  const preview = await stopPreview(project.id);
  const updated = await prisma.project.update({
    where: { id },
    data: { previewStatus: preview.state },
  });
  return NextResponse.json({ ok: true, project: updated, state: preview.state });
}
