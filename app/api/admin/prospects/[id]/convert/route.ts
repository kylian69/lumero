import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ensureClientUser, logActivity } from "@/lib/accounts";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (prospect.userId) {
    return NextResponse.json(
      { error: "Prospect déjà rattaché à un client", userId: prospect.userId },
      { status: 409 },
    );
  }

  const { user, tempPassword } = await ensureClientUser({
    email: prospect.email,
    name: prospect.contactName ?? prospect.companyName,
    phone: prospect.phone ?? undefined,
  });

  await prisma.prospect.update({
    where: { id },
    data: {
      userId: user.id,
      status: "WON",
      stageChangedAt: new Date(),
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "prospect",
    entityId: id,
    action: "converted_to_client",
    metadata: {
      clientUserId: user.id,
      email: user.email,
      newAccount: Boolean(tempPassword),
    },
  });

  return NextResponse.json({
    ok: true,
    clientUserId: user.id,
    tempPassword,
  });
}
