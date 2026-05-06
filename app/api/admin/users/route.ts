import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { createInvitation, inviteUrl } from "@/lib/invitations";
import { sendEmail } from "@/lib/email/client";
import { userInvitationTemplate } from "@/lib/email/templates";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "CLIENT"]),
  sendInvite: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role") as "ADMIN" | "CLIENT" | null;

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { name: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
      twoFactorEnabled: true,
      invitations: {
        where: { acceptedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, expiresAt: true, createdAt: true },
      },
    },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un utilisateur avec cet email existe déjà." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name ?? null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      phone: data.phone ?? null,
      role: data.role,
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "user",
    entityId: user.id,
    action: "created",
    metadata: { email: user.email, role: user.role },
  });

  if (data.sendInvite) {
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
  }

  return NextResponse.json({ ok: true, user });
}
