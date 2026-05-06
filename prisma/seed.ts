import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lumero.fr";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Équipe Lumero",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });
  console.log(`✔ Admin : ${admin.email} (mdp: ${adminPassword})`);

  // Client démo
  const clientEmail = "demo@lumero.fr";
  const clientPassword = "demo1234";
  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {},
    create: {
      email: clientEmail,
      name: "Atelier Rivière",
      phone: "06 12 34 56 78",
      role: "CLIENT",
      passwordHash: await bcrypt.hash(clientPassword, 10),
    },
  });
  console.log(`✔ Client démo : ${client.email} (mdp: ${clientPassword})`);

  // Prospect lié au client
  const prospect = await prisma.prospect.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
      companyName: "Atelier Rivière",
      contactName: "Claire Rivière",
      email: client.email,
      phone: client.phone,
      status: "WON",
      source: "QUESTIONNAIRE",
      estimatedValue: 49000,
    },
  });

  const existingQuestionnaire = await prisma.questionnaireResponse.findUnique({
    where: { prospectId: prospect.id },
  });
  if (!existingQuestionnaire) {
    await prisma.questionnaireResponse.create({
      data: {
        prospectId: prospect.id,
        metier: "artisan",
        objectifs: JSON.stringify(["vitrine", "rdv", "leads"]),
        style: "professionnel",
        inspiration: "Style naturel, tons chauds, photos haute qualité.",
        couleur: "#8B5CF6",
        fonctionnalites: JSON.stringify([
          "rdv",
          "galerie",
          "temoignages",
          "carte",
        ]),
        siteActuel: "https://atelier-riviere.fr",
        instagram: "https://instagram.com/atelierriviere",
        message: "Je souhaite donner un nouveau souffle à mon site actuel.",
      },
    });
  }

  // Projet
  const project = await prisma.project.upsert({
    where: { slug: "atelier-riviere" },
    update: {},
    create: {
      userId: client.id,
      name: "Atelier Rivière",
      slug: "atelier-riviere",
      domain: "atelier-riviere.fr",
      previewUrl: "https://preview.lumero.fr/atelier-riviere",
      status: "LIVE",
      planType: "STANDARD",
      primaryColor: "#8B5CF6",
      launchedAt: new Date(),
    },
  });

  // Abonnement
  const existingSub = await prisma.subscription.findFirst({
    where: { userId: client.id, status: "ACTIVE" },
  });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        userId: client.id,
        projectId: project.id,
        tier: "COMPLETE",
        status: "ACTIVE",
        monthlyAmount: 4900,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Quelques prospects entrants
  const prospectSamples = [
    {
      companyName: "Le Petit Café",
      email: "contact@petitcafe.fr",
      phone: "01 23 45 67 89",
      status: "NEW" as const,
      source: "QUESTIONNAIRE" as const,
    },
    {
      companyName: "Lumens Consulting",
      email: "hello@lumens.fr",
      status: "CONTACTED" as const,
      source: "QUOTE_FORM" as const,
    },
    {
      companyName: "Studio Flore",
      email: "flore@studio-flore.com",
      status: "PROPOSAL_SENT" as const,
      source: "QUESTIONNAIRE" as const,
      estimatedValue: 29000,
    },
  ];
  for (const p of prospectSamples) {
    const existing = await prisma.prospect.findFirst({
      where: { email: p.email },
    });
    if (!existing) {
      await prisma.prospect.create({ data: p });
    }
  }

  // Un ticket démo
  const hasDemoTicket = await prisma.supportTicket.findFirst({
    where: { authorId: client.id },
  });
  if (!hasDemoTicket) {
    const ticket = await prisma.supportTicket.create({
      data: {
        authorId: client.id,
        subject: "Changer la photo de couverture",
        category: "CONTENU",
        priority: "NORMAL",
        status: "WAITING_STAFF",
        messages: {
          create: {
            authorId: client.id,
            content:
              "Bonjour, pourriez-vous remplacer la photo de la page d'accueil par celle que je vous ai envoyée par email ? Merci !",
          },
        },
      },
    });
    console.log(`✔ Ticket démo : ${ticket.id}`);
  }

  // Backfill des numéros pour les tickets existants (ordre de création)
  const unnumbered = await prisma.supportTicket.findMany({
    where: { number: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (unnumbered.length > 0) {
    const maxBefore = await prisma.supportTicket.aggregate({
      where: { number: { not: null } },
      _max: { number: true },
    });
    let next = (maxBefore._max.number ?? 0) + 1;
    for (const t of unnumbered) {
      await prisma.supportTicket.update({
        where: { id: t.id },
        data: { number: next++ },
      });
    }
  }

  // Synchronise le compteur de tickets sur le max existant
  const maxTicket = await prisma.supportTicket.aggregate({
    _max: { number: true },
  });
  const maxValue = maxTicket._max.number ?? 0;
  await prisma.counter.upsert({
    where: { key: "supportTicket" },
    create: { key: "supportTicket", value: maxValue },
    update: { value: maxValue },
  });

  // Une demande de personnalisation
  const hasDemoCustom = await prisma.customizationRequest.findFirst({
    where: { userId: client.id },
  });
  if (!hasDemoCustom) {
    await prisma.customizationRequest.create({
      data: {
        userId: client.id,
        projectId: project.id,
        title: "Ajouter une page 'équipe'",
        description:
          "J'aimerais une page pour présenter les membres de l'équipe avec leurs photos et leurs rôles.",
        category: "fonctionnalite",
        priority: "NORMAL",
        status: "SUBMITTED",
      },
    });
  }

  console.log("✅ Seed terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
