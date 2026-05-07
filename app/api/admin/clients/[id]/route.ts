import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const schema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }
  const before = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, phone: true, archivedAt: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const { archived, ...rest } = parsed.data;
  const data: { name?: string | null; email?: string; phone?: string | null; archivedAt?: Date | null } = {
    ...rest,
  };
  if (data.email) data.email = data.email.toLowerCase().trim();
  if (data.email && data.email !== before.email) {
    const conflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (conflict && conflict.id !== id) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 },
      );
    }
  }
  if (archived === true && !before.archivedAt) {
    data.archivedAt = new Date();
  } else if (archived === false && before.archivedAt) {
    data.archivedAt = null;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  if (archived === true && !before.archivedAt) {
    await logActivity({
      userId: session.user.id,
      entityType: "client",
      entityId: id,
      action: "archived",
    });
  } else if (archived === false && before.archivedAt) {
    await logActivity({
      userId: session.user.id,
      entityType: "client",
      entityId: id,
      action: "unarchived",
    });
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of ["name", "email", "phone"] as const) {
    if (key in rest && data[key] !== before[key]) {
      changes[key] = { from: before[key], to: data[key] ?? null };
    }
  }
  if (Object.keys(changes).length > 0) {
    await logActivity({
      userId: session.user.id,
      entityType: "client",
      entityId: id,
      action: "updated",
      metadata: changes,
    });
  }
  return NextResponse.json({ ok: true, user });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.user.findUnique({
    where: { id, role: "CLIENT" },
    select: { name: true, email: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await prisma.user.delete({ where: { id } });
  await logActivity({
    userId: session.user.id,
    entityType: "client",
    entityId: id,
    action: "deleted",
    metadata: existing,
  });
  return NextResponse.json({ ok: true });
}
