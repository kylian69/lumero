import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

async function requireAdmin() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const grants = await prisma.previewAccess.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ grants });
}

const grantSchema = z.object({ email: z.string().email() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = grantSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Aucun compte avec cet email. La personne doit d'abord créer un compte." },
      { status: 404 }
    );
  }
  if (user.id === project.userId) {
    return NextResponse.json(
      { error: "Cet utilisateur est déjà le propriétaire du projet." },
      { status: 409 }
    );
  }

  const grant = await prisma.previewAccess.upsert({
    where: { projectId_userId: { projectId: id, userId: user.id } },
    create: { projectId: id, userId: user.id, grantedById: session.user.id },
    update: {},
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_access_granted",
    metadata: { userId: user.id, email: user.email },
  });

  return NextResponse.json({ ok: true, grant });
}

const revokeSchema = z.object({ userId: z.string().min(1) });

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = revokeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  await prisma.previewAccess.deleteMany({
    where: { projectId: id, userId: parsed.data.userId },
  });
  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: id,
    action: "preview_access_revoked",
    metadata: { userId: parsed.data.userId },
  });

  return NextResponse.json({ ok: true });
}
