import { storage, PreviewRow } from "./storage";
import { buildPreviewImage, syncRepo, workspaceForSlug } from "./builder";
import {
  containerNameForSlug,
  imageNameForSlug,
  removeContainerIfExists,
  removeImageIfExists,
  runContainer,
  stopContainerIfRunning,
} from "./docker";
import { config } from "./config";
import { deleteDnsRecord } from "./cloudflare";
import { centralLog } from "./central-log";
import fs from "node:fs";

/**
 * Build (or rebuild) the preview image then start a fresh container.
 * Sets state to BUILDING → STARTING → RUNNING (or ERROR).
 */
export async function buildAndStart(preview: PreviewRow) {
  storage.update(preview.id, { state: "BUILDING", errorMessage: null });
  try {
    const sha = await syncRepo({
      slug: preview.slug,
      repoFullName: preview.githubRepoFullName,
      branch: preview.githubBranch,
    });

    await buildPreviewImage({
      slug: preview.slug,
      onLog: (line) => console.log(`[build:${preview.slug}] ${line}`),
    });

    storage.update(preview.id, { state: "STARTING" });

    const containerName = containerNameForSlug(preview.slug);
    await runContainer({
      containerName,
      imageName: imageNameForSlug(preview.slug),
      port: preview.port,
    });

    storage.update(preview.id, {
      state: "RUNNING",
      containerName,
      lastBuiltAt: Date.now(),
      lastBuiltSha: sha,
      lastAccessAt: Date.now(),
      errorMessage: null,
    });

    console.log(`[lifecycle] ${preview.slug}: built & started (sha=${sha.slice(0, 7)})`);
    centralLog({
      category: "PROJECT",
      entityType: "preview",
      entityId: preview.slug,
      action: "preview_built",
      message: `Preview ${preview.slug} construite et démarrée`,
      metadata: { sha, hostname: preview.hostname },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[lifecycle] ${preview.slug}: build failed → ${message}`);
    storage.update(preview.id, { state: "ERROR", errorMessage: message });
    centralLog({
      level: "ERROR",
      category: "PROJECT",
      entityType: "preview",
      entityId: preview.slug,
      action: "preview_build_failed",
      message: `Échec de construction de la preview ${preview.slug}`,
      metadata: { error: message },
    });
    throw err;
  }
}

/**
 * Start an already-built preview (no rebuild).
 * If the image does not exist yet, falls back to buildAndStart.
 */
export async function start(preview: PreviewRow) {
  const { docker } = await import("./docker");
  const imageName = imageNameForSlug(preview.slug);
  try {
    await docker.getImage(imageName).inspect();
  } catch {
    // No image yet → first start needs a build
    return buildAndStart(preview);
  }

  storage.update(preview.id, { state: "STARTING", errorMessage: null });
  const containerName = containerNameForSlug(preview.slug);
  try {
    await runContainer({ containerName, imageName, port: preview.port });
    storage.update(preview.id, {
      state: "RUNNING",
      containerName,
      lastAccessAt: Date.now(),
    });
    console.log(`[lifecycle] ${preview.slug}: started`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    storage.update(preview.id, { state: "ERROR", errorMessage: message });
    throw err;
  }
}

export async function stop(preview: PreviewRow) {
  await stopContainerIfRunning(containerNameForSlug(preview.slug));
  storage.update(preview.id, { state: "STOPPED" });
  console.log(`[lifecycle] ${preview.slug}: stopped`);
  centralLog({
    category: "PROJECT",
    entityType: "preview",
    entityId: preview.slug,
    action: "preview_stopped",
    message: `Preview ${preview.slug} arrêtée`,
  });
}

export async function destroy(preview: PreviewRow) {
  await removeContainerIfExists(containerNameForSlug(preview.slug));
  await removeImageIfExists(imageNameForSlug(preview.slug));
  const dir = workspaceForSlug(preview.slug);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  await deleteDnsRecord(preview.hostname);
  storage.delete(preview.id);
  console.log(`[lifecycle] ${preview.slug}: destroyed`);
  centralLog({
    level: "WARN",
    category: "PROJECT",
    entityType: "preview",
    entityId: preview.slug,
    action: "preview_destroyed",
    message: `Preview ${preview.slug} détruite`,
  });
}

/**
 * Idempotent provisioning: register a new preview (does not start it yet).
 * The hostname is provided by the caller (Lume) so the orchestrator stays
 * agnostic of the domain layout.
 */
export function provision(opts: {
  id: string;
  slug: string;
  hostname: string;
  githubRepoFullName: string;
  githubBranch: string;
}): PreviewRow {
  const existing = storage.byId(opts.id) ?? storage.bySlug(opts.slug);
  if (existing) return existing;

  const now = Date.now();
  return storage.create({
    id: opts.id,
    slug: opts.slug,
    githubRepoFullName: opts.githubRepoFullName,
    githubBranch: opts.githubBranch,
    hostname: opts.hostname,
    containerName: null,
    state: "STOPPED",
    port: config.PREVIEW_DEFAULT_PORT,
    createdAt: now,
    updatedAt: now,
  });
}
