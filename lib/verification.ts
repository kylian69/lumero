import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type VerificationType = "email_change" | "2fa_setup";

export function generateNumericCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out;
}

export async function createVerificationCode(params: {
  userId: string;
  type: VerificationType;
  payload?: string;
  ttlMinutes?: number;
}): Promise<string> {
  const code = generateNumericCode(6);
  const codeHash = await bcrypt.hash(code, 10);
  const ttl = params.ttlMinutes ?? 15;

  await prisma.verificationCode.deleteMany({
    where: { userId: params.userId, type: params.type },
  });
  await prisma.verificationCode.create({
    data: {
      userId: params.userId,
      type: params.type,
      codeHash,
      payload: params.payload,
      expiresAt: new Date(Date.now() + ttl * 60_000),
    },
  });
  return code;
}

export async function consumeVerificationCode(params: {
  userId: string;
  type: VerificationType;
  code: string;
}): Promise<{ ok: boolean; payload?: string | null; error?: string }> {
  const record = await prisma.verificationCode.findFirst({
    where: { userId: params.userId, type: params.type },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, error: "Aucun code en attente" };
  if (record.expiresAt < new Date()) {
    await prisma.verificationCode.delete({ where: { id: record.id } });
    return { ok: false, error: "Code expiré" };
  }
  const ok = await bcrypt.compare(params.code, record.codeHash);
  if (!ok) return { ok: false, error: "Code invalide" };
  const payload = record.payload;
  await prisma.verificationCode.delete({ where: { id: record.id } });
  return { ok: true, payload };
}
