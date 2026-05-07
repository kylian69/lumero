import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const schema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["BRIEF", "DESIGN", "DEVELOPMENT", "REVIEW", "LIVE", "PAUSED", "ARCHIVED"]).optional(),
  planType: z.enum(["START", "STANDARD", "PRO"]).optional(),
  domain: z.string().nullable().optional(),
  previewUrl: z.string().url().nullable().optional(),
  previewStatus: z.enum(["NONE", "PROVISIONING", "READY", "REVIEW_SENT"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide", issues: parsed.error.issues }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "updated",
    metadata: parsed.data as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true, project: updated });
}

export async function DELETE(
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

  await prisma.project.delete({ where: { id } });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "deleted",
    metadata: { name: project.name },
  });

  return NextResponse.json({ ok: true });
}
