import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads", "tickets");

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function saveAttachmentFile(
  ticketId: string,
  buffer: Buffer,
  originalName: string,
) {
  return saveScopedFile(ticketId, buffer, originalName);
}

export async function saveScopedFile(
  scope: string,
  buffer: Buffer,
  originalName: string,
) {
  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "");
  const dir = path.join(UPLOADS_ROOT, safeScope);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(originalName).slice(0, 12).replace(/[^.a-zA-Z0-9]/g, "");
  const key = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, key), buffer);
  return `${safeScope}/${key}`;
}

export function resolveAttachmentPath(storageKey: string) {
  const safe = storageKey.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(UPLOADS_ROOT, safe);
}
