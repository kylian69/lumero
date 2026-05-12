import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { redeployPreview } from "@/lib/preview-orchestrator";

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

  const preview = await redeployPreview(project.id);
  const updated = await prisma.project.update({
    where: { id },
    data: { previewStatus: preview.state },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_redeployed",
  });

  return NextResponse.json({ ok: true, project: updated, state: preview.state });
}
