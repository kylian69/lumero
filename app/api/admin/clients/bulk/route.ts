import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("archive"),
    ids: z.array(z.string()).min(1),
  }),
  z.object({
    action: z.literal("unarchive"),
    ids: z.array(z.string()).min(1),
  }),
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.string()).min(1),
  }),
]);

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }

  const { action, ids } = parsed.data;

  if (action === "delete") {
    await prisma.user.deleteMany({ where: { id: { in: ids }, role: "CLIENT" } });
    await Promise.all(
      ids.map((id) =>
        logActivity({
          userId: session.user.id,
          entityType: "client",
          entityId: id,
          action: "deleted",
          metadata: { bulk: true },
        }),
      ),
    );
    return NextResponse.json({ ok: true, count: ids.length });
  }

  const archivedAt = action === "archive" ? new Date() : null;
  await prisma.user.updateMany({
    where: { id: { in: ids }, role: "CLIENT" },
    data: { archivedAt },
  });
  await Promise.all(
    ids.map((id) =>
      logActivity({
        userId: session.user.id,
        entityType: "client",
        entityId: id,
        action: action === "archive" ? "archived" : "unarchived",
        metadata: { bulk: true },
      }),
    ),
  );

  return NextResponse.json({ ok: true, count: ids.length });
}
