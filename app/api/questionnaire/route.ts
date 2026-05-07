import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/accounts";
import { sendEmail } from "@/lib/email/client";
import { getAdminEmails } from "@/lib/email/recipients";
import { prospectCreatedTemplate } from "@/lib/email/templates";

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

    // Vérifie si un compte utilisateur existe déjà pour cet email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const accountExists = !!existingUser;

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

    let prospect;
    let isNewProspect = false;

    if (accountExists) {
      // Le client a déjà un compte : on crée toujours un nouveau prospect
      // pour cette nouvelle demande de site, lié à son compte existant.
      prospect = await prisma.prospect.create({
        data: {
          companyName: data.entreprise,
          contactName: data.entreprise,
          email,
          phone: data.telephone || null,
          status: "NEW",
          source: "QUESTIONNAIRE",
          userId: existingUser.id,
          questionnaire: { create: questionnairePayload },
        },
        include: { questionnaire: true },
      });
      isNewProspect = true;
    } else {
      // Pas de compte : trouve ou crée un prospect par email
      prospect = await prisma.prospect.findFirst({
        where: { email },
        include: { questionnaire: true },
      });

      if (!prospect) {
        prospect = await prisma.prospect.create({
          data: {
            companyName: data.entreprise,
            contactName: data.entreprise,
            email,
            phone: data.telephone || null,
            status: "NEW",
            source: "QUESTIONNAIRE",
          },
          include: { questionnaire: true },
        });
        isNewProspect = true;
      } else if (prospect.questionnaire) {
        await prisma.questionnaireResponse.update({
          where: { id: prospect.questionnaire.id },
          data: questionnairePayload,
        });
      } else {
        await prisma.questionnaireResponse.create({
          data: { ...questionnairePayload, prospectId: prospect.id },
        });
      }
    }

    await logActivity({
      entityType: "prospect",
      entityId: prospect.id,
      action: isNewProspect ? "created" : "questionnaire_submitted",
      metadata: { source: "questionnaire" },
    });

    if (isNewProspect) {
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
    }

    return NextResponse.json({ ok: true, prospectId: prospect.id, accountExists });
  } catch (err) {
    console.error("[/api/questionnaire]", err);
    return NextResponse.json(
      { error: "Erreur interne. Merci de réessayer." },
      { status: 500 },
    );
  }
}
