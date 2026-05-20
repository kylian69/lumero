import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Détermine si un utilisateur a le droit de voir la preview d'un projet.
 * Règle : ADMIN OU propriétaire du projet OU entrée explicite dans PreviewAccess.
 */
export async function canAccessPreview(
  user: { id: string; role: Role },
  projectId: string
): Promise<boolean> {
  if (user.role === "ADMIN") return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project) return false;
  if (project.userId === user.id) return true;

  const grant = await prisma.previewAccess.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
    select: { id: true },
  });
  return grant !== null;
}
