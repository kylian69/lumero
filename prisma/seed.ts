import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ─── Comptes ──────────────────────────────────────────────────────────────

  const adminEmail = process.env.ADMIN_EMAIL || "admin@lumero.fr";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Équipe Lumero",
      firstName: "Équipe",
      lastName: "Lumero",
      role: "ADMIN",
      mustChangePassword: false,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });
  console.log(`✔ Admin       : ${admin.email}  (mdp: ${adminPassword})`);

  const clientEmail = "demo@lumero.fr";
  const clientPassword = "demo1234";

  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: {},
    create: {
      email: clientEmail,
      name: "Claire Rivière",
      firstName: "Claire",
      lastName: "Rivière",
      phone: "06 12 34 56 78",
      role: "CLIENT",
      mustChangePassword: false,
      passwordHash: await bcrypt.hash(clientPassword, 10),
    },
  });
  console.log(`✔ Client démo : ${client.email}  (mdp: ${clientPassword})`);

  // ─── Prospect lié au client ───────────────────────────────────────────────

  let prospect = await prisma.prospect.findFirst({
    where: { userId: client.id },
    include: { questionnaire: true },
  });

  if (!prospect) {
    prospect = await prisma.prospect.create({
      data: {
        userId: client.id,
        companyName: "Atelier Rivière",
        contactName: "Claire Rivière",
        email: client.email,
        phone: client.phone,
        status: "WON",
        source: "QUESTIONNAIRE",
        estimatedValue: 49000,
      },
      include: { questionnaire: true },
    });
  }

  if (!prospect.questionnaire) {
    await prisma.questionnaireResponse.create({
      data: {
        prospectId: prospect.id,
        metier: "artisan",
        objectifs: JSON.stringify(["vitrine", "rdv", "leads"]),
        style: "professionnel",
        inspiration: "Style naturel, tons chauds, photos haute qualité.",
        couleur: "#8B5CF6",
        fonctionnalites: JSON.stringify(["rdv", "galerie", "temoignages", "carte"]),
        siteActuel: "https://atelier-riviere.fr",
        instagram: "https://instagram.com/atelierriviere",
        message: "Je souhaite donner un nouveau souffle à mon site actuel.",
      },
    });
  }
  console.log(`✔ Prospect    : Atelier Rivière (WON)`);

  // ─── Projet ───────────────────────────────────────────────────────────────

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
  console.log(`✔ Projet      : ${project.name} (${project.status})`);

  // ─── Abonnement ───────────────────────────────────────────────────────────

  const existingSub = await prisma.subscription.findFirst({
    where: { projectId: project.id, status: "ACTIVE" },
  });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        projectId: project.id,
        tier: "COMPLETE",
        status: "ACTIVE",
        monthlyAmount: 4900,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✔ Abonnement  : COMPLETE actif`);

  // ─── Prospects entrants (sans compte) ────────────────────────────────────

  const prospectSamples = [
    {
      companyName: "Le Petit Café",
      contactName: "Marc Durand",
      email: "contact@petitcafe.fr",
      phone: "01 23 45 67 89",
      status: "NEW" as const,
      source: "QUESTIONNAIRE" as const,
    },
    {
      companyName: "Lumens Consulting",
      contactName: "Sophie Martin",
      email: "hello@lumens.fr",
      status: "CONTACTED" as const,
      source: "QUOTE_FORM" as const,
    },
    {
      companyName: "Studio Flore",
      contactName: "Flore Bernard",
      email: "flore@studio-flore.com",
      status: "PROPOSAL_SENT" as const,
      source: "QUESTIONNAIRE" as const,
      estimatedValue: 29000,
    },
  ];

  for (const p of prospectSamples) {
    const existing = await prisma.prospect.findFirst({ where: { email: p.email } });
    if (!existing) {
      await prisma.prospect.create({ data: p });
    }
  }
  console.log(`✔ Prospects   : ${prospectSamples.length} échantillons`);

  // ─── Tickets de support ───────────────────────────────────────────────────

  const ticketCount = await prisma.supportTicket.count({ where: { authorId: client.id } });

  if (ticketCount === 0) {
    // Ticket 1 : en attente de réponse staff avec échange
    const ticket1 = await prisma.supportTicket.create({
      data: {
        authorId: client.id,
        projectId: project.id,
        subject: "Changer la photo de couverture",
        category: "CONTENU",
        priority: "NORMAL",
        status: "WAITING_STAFF",
        messages: {
          create: [
            {
              authorId: client.id,
              content:
                "Bonjour, pourriez-vous remplacer la photo de la page d'accueil par celle que je vous ai envoyée par email ? Je souhaite une image plus lumineuse pour l'été. Merci !",
            },
            {
              authorId: admin.id,
              content:
                "Bonjour Claire, bien reçu ! Pouvez-vous nous confirmer le nom exact du fichier envoyé ? Nous allons procéder dès validation.",
            },
          ],
        },
      },
    });
    console.log(`✔ Ticket 1    : #${ticket1.id} — Changer la photo de couverture`);

    // Ticket 2 : résolu, problème technique
    const ticket2 = await prisma.supportTicket.create({
      data: {
        authorId: client.id,
        projectId: project.id,
        subject: "Formulaire de contact ne fonctionne pas",
        category: "TECHNIQUE",
        priority: "HIGH",
        status: "RESOLVED",
        closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        messages: {
          create: [
            {
              authorId: client.id,
              content:
                "Bonjour, depuis hier les visiteurs m'ont signalé que le formulaire de contact sur la page 'Nous contacter' ne fonctionne plus. Un message d'erreur apparaît après soumission.",
            },
            {
              authorId: admin.id,
              content:
                "Bonjour Claire, nous avons identifié le problème : une clé API Resend avait expiré. C'est corrigé, le formulaire fonctionne à nouveau. Désolé pour la gêne !",
            },
            {
              authorId: client.id,
              content: "Parfait, merci pour la réactivité !",
            },
          ],
        },
      },
    });
    console.log(`✔ Ticket 2    : #${ticket2.id} — Formulaire de contact`);
  } else {
    console.log(`✔ Tickets     : déjà présents, ignorés`);
  }

  // Numérotation des tickets sans numéro
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
      await prisma.supportTicket.update({ where: { id: t.id }, data: { number: next++ } });
    }
  }

  // Synchronise le compteur
  const maxTicket = await prisma.supportTicket.aggregate({ _max: { number: true } });
  const maxValue = maxTicket._max.number ?? 0;
  await prisma.counter.upsert({
    where: { key: "supportTicket" },
    create: { key: "supportTicket", value: maxValue },
    update: { value: maxValue },
  });
  console.log(`✔ Compteur    : tickets → ${maxValue}`);

  // ─── Demandes de personnalisation ─────────────────────────────────────────

  const customCount = await prisma.customizationRequest.count({ where: { userId: client.id } });

  if (customCount === 0) {
    // Personnalisation 1 : en cours
    const custom1 = await prisma.customizationRequest.create({
      data: {
        userId: client.id,
        projectId: project.id,
        title: "Ajouter une page 'Notre équipe'",
        description:
          "J'aimerais une page dédiée pour présenter les membres de l'atelier avec leurs photos, prénoms et spécialités.",
        category: "fonctionnalite",
        priority: "NORMAL",
        status: "IN_PROGRESS",
        messages: {
          create: [
            {
              authorId: client.id,
              content:
                "Bonjour, je souhaite ajouter une page équipe. J'ai 4 personnes à présenter, chacune avec une photo carrée et une courte bio.",
            },
            {
              authorId: admin.id,
              content:
                "Super idée ! Nous allons créer la section. Merci de nous envoyer les photos (format carré recommandé, min 400×400 px) et les textes de présentation.",
            },
          ],
        },
      },
    });
    console.log(`✔ Perso 1     : #${custom1.id} — Page équipe (IN_PROGRESS)`);

    // Personnalisation 2 : soumise, en attente
    const custom2 = await prisma.customizationRequest.create({
      data: {
        userId: client.id,
        projectId: project.id,
        title: "Modifier la palette de couleurs",
        description:
          "Je voudrais passer la couleur principale du violet actuel (#8B5CF6) à un vert sauge (#6B8F71) pour mieux correspondre à l'identité visuelle de l'atelier.",
        category: "design",
        priority: "LOW",
        status: "SUBMITTED",
        messages: {
          create: [
            {
              authorId: client.id,
              content:
                "Bonjour, suite à notre refonte de logo je souhaite changer la couleur principale. La nouvelle couleur est le vert sauge #6B8F71. Pourriez-vous faire un aperçu avant de déployer ?",
            },
          ],
        },
      },
    });
    console.log(`✔ Perso 2     : #${custom2.id} — Palette couleurs (SUBMITTED)`);
  } else {
    console.log(`✔ Perso       : demandes déjà présentes, ignorées`);
  }

  console.log("\n✅ Seed terminé\n");
  console.log("  admin@lumero.fr   →  admin1234");
  console.log("  demo@lumero.fr    →  demo1234\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
