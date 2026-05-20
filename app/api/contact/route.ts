import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureClientUser, logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import {
  prospectCreatedTemplate,
  quoteRequestedTemplate,
} from "@/lib/email/templates";
import { getSession } from "@/lib/session";

const schema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().optional().default(""),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  planType: z.enum(["START", "STANDARD", "PRO"]).optional(),
  subscription: z.enum(["NONE", "LIGHT", "COMPLETE"]).optional(),
  budget: z.number().int().optional(),
  timeline: z.string().optional().default(""),
  details: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const email = d.email.toLowerCase().trim();
    const session = await getSession();

    let userId: string;
    let tempPassword: string | null = null;

    if (session?.user) {
      // Utilisateur connecté : on rattache la demande à son compte
      userId = session.user.id;
    } else {
      // Non connecté : si un compte existe déjà, on exige la connexion
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json({ requiresLogin: true });
      }

      // Aucun compte : on en crée un et on renvoie le mot de passe temporaire
      // (affiché à l'écran uniquement, jamais envoyé par email)
      const account = await ensureClientUser({
        email,
        name: d.companyName,
        phone: d.phone || undefined,
      });
      userId = account.user.id;
      tempPassword = account.tempPassword;

      await logActivity({
        userId: account.user.id,
        entityType: "user",
        entityId: account.user.id,
        action: "account_created",
        metadata: { source: "template_order" },
      });
    }

    let prospect = await prisma.prospect.findFirst({
      where: {
        OR: [{ userId }, { email }],
      },
    });
    let isNewProspect = false;
    if (!prospect) {
      prospect = await prisma.prospect.create({
        data: {
          userId,
          companyName: d.companyName,
          contactName: d.contactName || null,
          email,
          phone: d.phone || null,
          status: "NEW",
          source: "QUOTE_FORM",
          estimatedValue: d.budget ?? null,
        },
      });
      isNewProspect = true;
    } else if (d.budget != null && prospect.estimatedValue == null) {
      prospect = await prisma.prospect.update({
        where: { id: prospect.id },
        data: { estimatedValue: d.budget },
      });
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        prospectId: prospect.id,
        planType: d.planType ?? null,
        subscription: d.subscription ?? null,
        budget: d.budget ?? null,
        timeline: d.timeline || null,
        details: d.details || null,
      },
    });

    await logActivity({
      userId,
      entityType: "prospect",
      entityId: prospect.id,
      action: "quote_requested",
      metadata: { quoteId: quote.id, planType: d.planType },
    });

    const adminEmails = await getAdminEmails();
    if (adminEmails.length > 0) {
      if (isNewProspect) {
        const tpl = prospectCreatedTemplate({
          id: prospect.id,
          companyName: prospect.companyName,
          email: prospect.email,
          phone: prospect.phone,
          source: "QUOTE_FORM",
        });
        await sendEmail({ to: adminEmails, ...tpl });
      }
      const tpl = quoteRequestedTemplate({
        prospectId: prospect.id,
        companyName: prospect.companyName,
        email: prospect.email,
        planType: d.planType ?? null,
        budgetCents: d.budget ?? null,
        timeline: d.timeline || null,
        details: d.details || null,
      });
      await sendEmail({ to: adminEmails, ...tpl });
    }

    return NextResponse.json({
      ok: true,
      prospectId: prospect.id,
      quoteId: quote.id,
      accountExists: !tempPassword,
      tempPassword,
    });
  } catch (err) {
    console.error("[/api/contact]", err);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
