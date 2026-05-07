import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    ids: z.array(z.string()).min(1),
    status: z.enum([
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL_SENT",
      "NEGOTIATING",
      "WON",
      "LOST",
      "ARCHIVED",
    ]),
  }),
  z.object({
    action: z.literal("archive"),
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
    await prisma.prospect.deleteMany({ where: { id: { in: ids } } });
    await Promise.all(
      ids.map((id) =>
        logActivity({
          userId: session.user.id,
          entityType: "prospect",
          entityId: id,
          action: "deleted",
          metadata: { bulk: true },
        }),
      ),
    );
    return NextResponse.json({ ok: true, count: ids.length });
  }

  const targetStatus =
    action === "archive" ? "ARCHIVED" : parsed.data.status;

  await prisma.prospect.updateMany({
    where: { id: { in: ids } },
    data: { status: targetStatus, stageChangedAt: new Date() },
  });
  await Promise.all(
    ids.map((id) =>
      logActivity({
        userId: session.user.id,
        entityType: "prospect",
        entityId: id,
        action: "status_changed",
        metadata: { to: targetStatus, bulk: true },
      }),
    ),
  );

  return NextResponse.json({ ok: true, count: ids.length });
}
