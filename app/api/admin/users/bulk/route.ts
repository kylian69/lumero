import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const schema = z.object({
  action: z.literal("delete"),
  ids: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }

  const { ids } = parsed.data;

  // Cannot delete self
  const safeIds = ids.filter((id) => id !== session.user.id);

  // Protect the last admin
  const targets = await prisma.user.findMany({
    where: { id: { in: safeIds } },
    select: { id: true, email: true, role: true },
  });

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  const adminsToDelete = targets.filter((u) => u.role === "ADMIN").length;

  if (adminCount - adminsToDelete < 1) {
    return NextResponse.json(
      { error: "Impossible de supprimer tous les administrateurs." },
      { status: 400 },
    );
  }

  const deletableIds = targets.map((u) => u.id);
  await prisma.user.deleteMany({ where: { id: { in: deletableIds } } });

  await Promise.all(
    targets.map((u) =>
      logActivity({
        userId: session.user.id,
        entityType: "user",
        entityId: u.id,
        action: "deleted",
        metadata: { email: u.email, role: u.role, bulk: true },
      }),
    ),
  );

  const skipped = ids.length - deletableIds.length;
  return NextResponse.json({ ok: true, count: deletableIds.length, skipped });
}
