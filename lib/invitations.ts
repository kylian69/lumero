import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const TTL_DAYS = 7;

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createInvitation(params: {
  userId: string;
  invitedById?: string | null;
}) {
  await prisma.invitation.deleteMany({
    where: { userId: params.userId, acceptedAt: null },
  });
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.invitation.create({
    data: {
      userId: params.userId,
      invitedById: params.invitedById ?? null,
      token,
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export function inviteUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base}/accept-invite?token=${token}`;
}
