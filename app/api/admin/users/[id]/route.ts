import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const patchSchema = z.object({
  name: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "CLIENT"]).optional(),
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
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }

  const before = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
    },
  });
  if (!before) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const data = { ...parsed.data };
  if (data.email) data.email = data.email.toLowerCase().trim();

  if (data.email && data.email !== before.email) {
    const conflict = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (conflict && conflict.id !== id) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 },
      );
    }
  }

  // Empêcher un admin de retirer son propre rôle ADMIN
  if (data.role && id === session.user.id && data.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Vous ne pouvez pas modifier votre propre rôle." },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({ where: { id }, data });

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of [
    "name",
    "firstName",
    "lastName",
    "email",
    "phone",
    "role",
  ] as const) {
    if (key in parsed.data && data[key] !== before[key]) {
      changes[key] = { from: before[key], to: data[key] ?? null };
    }
  }
  if (Object.keys(changes).length > 0) {
    await logActivity({
      userId: session.user.id,
      entityType: "user",
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

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Impossible de supprimer le dernier administrateur." },
        { status: 400 },
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  await logActivity({
    userId: session.user.id,
    entityType: "user",
    entityId: id,
    action: "deleted",
    metadata: { email: target.email, role: target.role },
  });

  return NextResponse.json({ ok: true });
}
