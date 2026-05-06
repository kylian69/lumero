import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { previewPublishedTemplate } from "@/lib/email/templates";

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
  if (!project.previewUrl) {
    return NextResponse.json(
      { error: "Aucune URL de preview disponible. Attendez que le déploiement Vercel soit terminé." },
      { status: 422 }
    );
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: "REVIEW",
      previewStatus: "REVIEW_SENT",
      previewPublishedAt: new Date(),
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_published",
    metadata: { previewUrl: project.previewUrl },
  });

  // Send email notification to client
  const clientName = project.user.firstName ?? project.user.name ?? null;
  const tpl = previewPublishedTemplate({
    clientName,
    projectName: project.name,
    previewUrl: project.previewUrl,
  });
  await sendEmail({ to: project.user.email, ...tpl });

  return NextResponse.json({ ok: true, project: updated });
}
