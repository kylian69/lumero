import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

const schema = z.object({
  userId: z.string(),
  name: z.string().min(1),
  planType: z.enum(["NONE", "START", "STANDARD", "PRO"]).default("NONE"),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide", issues: parsed.error.issues }, { status: 400 });
  }

  const { userId, name, planType } = parsed.data;
  const baseSlug = parsed.data.slug ?? toSlug(name);

  // Ensure slug uniqueness by appending a suffix if needed
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.project.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name,
      slug,
      planType,
      status: "BRIEF",
      previewStatus: "NONE",
    },
  });

  await logActivity({
    userId: session.user.id,
    entityType: "project",
    entityId: project.id,
    action: "created",
    metadata: { name, planType },
  });

  return NextResponse.json({ ok: true, project });
}
