import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { createInvitation, inviteUrl } from "@/lib/invitations";
import { sendEmail } from "@/lib/email/client";
import { userInvitationTemplate } from "@/lib/email/templates";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const { token } = await createInvitation({
    userId: user.id,
    invitedById: session.user.id,
  });

  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  const tpl = userInvitationTemplate({
    inviteUrl: inviteUrl(token),
    email: user.email,
    name: user.name,
    role: user.role,
    invitedByName: inviter?.name ?? inviter?.email ?? null,
  });

  await sendEmail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });

  await logActivity({
    userId: session.user.id,
    entityType: "user",
    entityId: id,
    action: "invited",
    metadata: { email: user.email },
  });

  return NextResponse.json({ ok: true });
}
