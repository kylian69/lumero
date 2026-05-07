import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureClientUser, logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import { prospectCreatedTemplate } from "@/lib/email/templates";
import { getSession } from "@/lib/session";

const schema = z.object({
  metier: z.string().optional().default(""),
  metierCustom: z.string().optional().default(""),
  objectifs: z.array(z.string()).optional().default([]),
  objectifCustom: z.string().optional().default(""),
  style: z.string().optional().default(""),
  inspiration: z.string().optional().default(""),
  logoName: z.string().optional().default(""),
  logoPreview: z.string().optional().default(""),
  couleur: z.string().optional().default(""),
  fonctionnalites: z.array(z.string()).optional().default([]),
  siteActuel: z.string().optional().default(""),
  googleBusiness: z.string().optional().default(""),
  instagram: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  entreprise: z.string().min(1, "Nom d'entreprise requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional().default(""),
  message: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const email = data.email.toLowerCase().trim();
    const session = await getSession();

    const questionnairePayload = {
      metier: data.metier || null,
      metierCustom: data.metierCustom || null,
      objectifs: JSON.stringify(data.objectifs),
      objectifCustom: data.objectifCustom || null,
      style: data.style || null,
      inspiration: data.inspiration || null,
      logoName: data.logoName || null,
      logoPreview: data.logoPreview || null,
      couleur: data.couleur || null,
      fonctionnalites: JSON.stringify(data.fonctionnalites),
      siteActuel: data.siteActuel || null,
      googleBusiness: data.googleBusiness || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      linkedin: data.linkedin || null,
      message: data.message || null,
    };

    let userId: string | null = null;
    let tempPassword: string | null = null;

    if (session?.user) {
      // Utilisateur connecté : on utilise son compte existant
      userId = session.user.id;
    } else {
      // Utilisateur non connecté : si un compte existe pour cet email,
      // il doit se connecter avant de soumettre une nouvelle demande
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json({ requiresLogin: true });
      }

      // Aucun compte : on en crée un et on renvoie le mot de passe temporaire
      // directement dans la réponse pour l'afficher à l'écran
      const result = await ensureClientUser({
        email,
        name: data.entreprise,
        phone: data.telephone || undefined,
      });
      userId = result.user.id;
      tempPassword = result.tempPassword;

      await logActivity({
        userId: result.user.id,
        entityType: "user",
        entityId: result.user.id,
        action: "account_created",
        metadata: { source: "questionnaire" },
      });
    }

    // Crée systématiquement un nouveau prospect pour chaque demande
    const prospect = await prisma.prospect.create({
      data: {
        companyName: data.entreprise,
        contactName: data.entreprise,
        email,
        phone: data.telephone || null,
        status: "NEW",
        source: "QUESTIONNAIRE",
        userId,
        questionnaire: { create: questionnairePayload },
      },
    });

    await logActivity({
      entityType: "prospect",
      entityId: prospect.id,
      action: "created",
      metadata: { source: "questionnaire" },
    });

    const adminEmails = await getAdminEmails();
    if (adminEmails.length > 0) {
      const tpl = prospectCreatedTemplate({
        id: prospect.id,
        companyName: prospect.companyName,
        email: prospect.email,
        phone: prospect.phone,
        source: "QUESTIONNAIRE",
      });
      await sendEmail({ to: adminEmails, ...tpl });
    }

    return NextResponse.json({
      ok: true,
      prospectId: prospect.id,
      accountExists: !tempPassword,
      // Affiché à l'écran uniquement, jamais envoyé par email
      tempPassword,
    });
  } catch (err) {
    console.error("[/api/questionnaire]", err);
    return NextResponse.json(
      { error: "Erreur interne. Merci de réessayer." },
      { status: 500 },
    );
  }
}
