import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import { ticketMessageToAdminsTemplate } from "@/lib/email/templates";
import { nextTicketNumber } from "@/lib/ticket-number";

const attachmentInput = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
});

const createSchema = z.object({
  subject: z.string().min(3, "Sujet trop court"),
  category: z
    .enum(["TECHNIQUE", "FACTURATION", "CONTENU", "FONCTIONNALITE", "PREVIEW_ACCESS", "AUTRE"])
    .default("AUTRE"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  content: z.string().min(10, "Message trop court"),
  projectId: z.string().optional(),
  attachments: z.array(attachmentInput).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const number = await nextTicketNumber();
  const ticket = await prisma.supportTicket.create({
    data: {
      number,
      authorId: session.user.id,
      subject: d.subject,
      category: d.category,
      priority: d.priority,
      status: "OPEN",
      projectId: d.projectId ?? null,
      messages: {
        create: {
          authorId: session.user.id,
          content: d.content,
          ...(d.attachments?.length
            ? {
                attachments: {
                  create: d.attachments.map((a) => ({
                    filename: a.filename,
                    mimeType: a.mimeType,
                    size: a.size,
                    storageKey: a.storageKey,
                  })),
                },
              }
            : {}),
        },
      },
    },
  });
  await logActivity({
    userId: session.user.id,
    entityType: "ticket",
    entityId: ticket.id,
    action: "created",
  });

  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0) {
    const tpl = ticketMessageToAdminsTemplate({
      ticketId: ticket.id,
      subject: ticket.subject,
      isNewTicket: true,
      content: d.content,
      clientEmail: session.user.email,
      clientName: session.user.name,
    });
    await sendEmail({ to: adminEmails, ...tpl, replyTo: session.user.email });
  }

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const tickets = await prisma.supportTicket.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      category: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ tickets });
}
