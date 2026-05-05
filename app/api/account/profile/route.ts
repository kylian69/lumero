import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  name: z.string().max(120).optional(),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }
  const data: Record<string, string | null> = {};
  for (const k of ["name", "firstName", "lastName", "phone"] as const) {
    const v = parsed.data[k];
    if (v !== undefined) data[k] = v.trim() === "" ? null : v.trim();
  }
  // Sync `name` from first/last when not explicitly provided.
  if (
    parsed.data.name === undefined &&
    (parsed.data.firstName !== undefined || parsed.data.lastName !== undefined)
  ) {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    const fn =
      parsed.data.firstName !== undefined ? parsed.data.firstName : current?.firstName ?? "";
    const ln =
      parsed.data.lastName !== undefined ? parsed.data.lastName : current?.lastName ?? "";
    const combined = `${fn ?? ""} ${ln ?? ""}`.trim();
    data.name = combined || null;
  }
  await prisma.user.update({ where: { id: session.user.id }, data });
  return NextResponse.json({ ok: true });
}
