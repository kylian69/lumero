import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recordLog, type RecordLogInput } from "@/lib/log";

// Génère un mot de passe temporaire aléatoire
export function generateTempPassword(length = 12) {
  const chars =
    "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// Crée (ou récupère) un utilisateur client et retourne son éventuel mot de
// passe temporaire (uniquement si le compte vient d'être créé).
export async function ensureClientUser(params: {
  email: string;
  name?: string;
  phone?: string;
}) {
  const email = params.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { user: existing, tempPassword: null };

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const user = await prisma.user.create({
    data: {
      email,
      name: params.name ?? null,
      phone: params.phone ?? null,
      passwordHash,
      role: "CLIENT",
      mustChangePassword: true,
    },
  });
  return { user, tempPassword };
}

/**
 * Journalise une action métier. Conserve la signature historique tout en
 * acceptant les champs enrichis (level, category, message, ip, userAgent,
 * request). Délègue au pipeline centralisé lib/log.ts (persistance + console
 * structurée + déclencheurs).
 */
export async function logActivity(params: RecordLogInput) {
  await recordLog(params);
}
