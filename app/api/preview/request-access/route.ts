import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import { ticketMessageToAdminsTemplate } from "@/lib/email/templates";
import { nextTicketNumber } from "@/lib/ticket-number";

const schema = z.object({ projectId: z.string().min(1) });

// Un utilisateur connecté mais non autorisé demande l'accès à une preview.
// Cela crée un ticket de support (catégorie PREVIEW_ACCESS) qu'un admin pourra
// traiter en accordant l'accès.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const { projectId } = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, userId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  // Déjà autorisé : rien à demander.
  if (project.userId === session.user.id || session.user.role === "ADMIN") {
    return NextResponse.json({ ok: true, alreadyAllowed: true });
  }
  const existingGrant = await prisma.previewAccess.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true },
  });
  if (existingGrant) {
    return NextResponse.json({ ok: true, alreadyAllowed: true });
  }

  // Éviter les doublons : un ticket de demande déjà ouvert pour ce projet.
  const existingTicket = await prisma.supportTicket.findFirst({
    where: {
      authorId: session.user.id,
      projectId,
      category: "PREVIEW_ACCESS",
      status: { in: ["OPEN", "WAITING_CLIENT", "WAITING_STAFF"] },
    },
    select: { id: true },
  });
  if (existingTicket) {
    return NextResponse.json({ ok: true, ticketId: existingTicket.id, duplicate: true });
  }

  const content = `${session.user.name || session.user.email} demande l'accès à la preview du projet « ${project.name} ».`;
  const number = await nextTicketNumber();
  const ticket = await prisma.supportTicket.create({
    data: {
      number,
      authorId: session.user.id,
      subject: `Demande d'accès preview — ${project.name}`,
      category: "PREVIEW_ACCESS",
      priority: "NORMAL",
      status: "OPEN",
      projectId,
      messages: { create: { authorId: session.user.id, content } },
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
      content,
      clientEmail: session.user.email,
      clientName: session.user.name,
    });
    await sendEmail({ to: adminEmails, ...tpl, replyTo: session.user.email });
  }

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
