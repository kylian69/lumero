import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

export const AVATARS_ROOT = path.join(process.cwd(), "uploads", "avatars");

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_AVATAR_MIME = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function saveAvatarFile(
  userId: string,
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  await fs.mkdir(AVATARS_ROOT, { recursive: true });
  const ext = path.extname(originalName).slice(0, 8).replace(/[^.a-zA-Z0-9]/g, "");
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const key = `${safeUser}-${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(AVATARS_ROOT, key), buffer);
  return key;
}

export function resolveAvatarPath(storageKey: string): string {
  const safe = storageKey.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(AVATARS_ROOT, safe);
}

export async function deleteAvatar(storageKey: string): Promise<void> {
  try {
    await fs.unlink(resolveAvatarPath(storageKey));
  } catch {
    // ignore
  }
}

export function avatarUrlFor(storageKey: string | null | undefined): string | null {
  if (!storageKey) return null;
  return `/api/account/avatar/${encodeURIComponent(storageKey)}`;
}

export function initialsFor(input: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  const fn = (input.firstName ?? "").trim();
  const ln = (input.lastName ?? "").trim();
  if (fn || ln) {
    return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || "?";
  }
  const n = (input.name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/);
    return ((parts[0]?.charAt(0) ?? "") + (parts[1]?.charAt(0) ?? "")).toUpperCase() || n.charAt(0).toUpperCase();
  }
  return (input.email ?? "?").charAt(0).toUpperCase();
}
