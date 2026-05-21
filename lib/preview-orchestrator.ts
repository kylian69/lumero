/**
 * Typed client for the self-hosted preview-orchestrator service.
 * See services/preview-orchestrator/README.md.
 */

const ORCHESTRATOR_URL =
  process.env.PREVIEW_ORCHESTRATOR_URL ?? "http://preview-orchestrator:8080";
const TOKEN = process.env.PREVIEW_INTERNAL_API_TOKEN;

export type OrchestratorState =
  | "STOPPED"
  | "STARTING"
  | "BUILDING"
  | "RUNNING"
  | "ERROR";

export type OrchestratorPreview = {
  id: string;
  slug: string;
  githubRepoFullName: string;
  githubBranch: string;
  hostname: string;
  state: OrchestratorState;
  port: number;
  lastAccessAt: number | null;
  lastBuiltAt: number | null;
  lastBuiltSha: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
};

async function call<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  if (!TOKEN) {
    throw new Error("PREVIEW_INTERNAL_API_TOKEN is not configured");
  }
  const headers: Record<string, string> = {
    "x-internal-token": TOKEN,
    ...(init?.headers as Record<string, string> | undefined),
  };
  const body =
    init?.json !== undefined ? JSON.stringify(init.json) : (init?.body as BodyInit | undefined);
  if (init?.json !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(`${ORCHESTRATOR_URL}${path}`, {
    ...init,
    headers,
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `preview-orchestrator ${init?.method ?? "GET"} ${path} → ${res.status}: ${text}`
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function provisionPreview(input: {
  id: string;
  slug: string;
  hostname: string;
  githubRepoFullName: string;
  githubBranch: string;
}): Promise<OrchestratorPreview> {
  const data = await call<{ preview: OrchestratorPreview }>("/api/projects", {
    method: "POST",
    json: input,
  });
  return data.preview;
}

export async function getPreview(id: string): Promise<OrchestratorPreview | null> {
  try {
    const data = await call<{ preview: OrchestratorPreview }>(`/api/projects/${id}`);
    return data.preview;
  } catch (err) {
    if (err instanceof Error && err.message.includes("→ 404")) return null;
    throw err;
  }
}

/**
 * Make sure the orchestrator knows about this project. If the orchestrator's
 * state was wiped (e.g. service redeploy with ephemeral SQLite) or the project
 * was never provisioned there, re-register it from the data we hold in Prisma.
 * No-op when the project is already registered.
 */
export async function ensureProvisioned(input: {
  id: string;
  slug: string;
  hostname: string;
  githubRepoFullName: string;
  githubBranch: string;
}): Promise<OrchestratorPreview> {
  const existing = await getPreview(input.id);
  if (existing) return existing;
  return provisionPreview(input);
}

export async function startPreview(id: string): Promise<OrchestratorPreview> {
  const data = await call<{ preview: OrchestratorPreview }>(
    `/api/projects/${id}/start`,
    { method: "POST" }
  );
  return data.preview;
}

export async function stopPreview(id: string): Promise<OrchestratorPreview> {
  const data = await call<{ preview: OrchestratorPreview }>(
    `/api/projects/${id}/stop`,
    { method: "POST" }
  );
  return data.preview;
}

export async function redeployPreview(id: string): Promise<OrchestratorPreview> {
  const data = await call<{ preview: OrchestratorPreview }>(
    `/api/projects/${id}/redeploy`,
    { method: "POST" }
  );
  return data.preview;
}

export async function destroyPreview(id: string, slug?: string): Promise<void> {
  const qs = slug ? `?slug=${encodeURIComponent(slug)}` : "";
  await call(`/api/projects/${id}${qs}`, { method: "DELETE" });
}

/**
 * Hostname pattern: <slug>-<short-id>-preview.<base>.
 * - <slug>      = Project.slug (already URL-friendly)
 * - <short-id>  = first 6 chars of Project.id (cuid), avoids collisions
 * - "-preview"  = suffix marking the URL as a preview environment
 * Stays stable for the lifetime of the project (no commit-dependent parts).
 */
export function previewHostnameForProject(
  slug: string,
  projectId: string,
  base: string = process.env.PREVIEW_BASE_DOMAIN ?? "lumero.fr"
): string {
  const shortId = projectId.slice(0, 6).toLowerCase();
  // Separator between the "-preview" marker and the base domain. Defaults to a
  // dot ("...-preview.lumero.fr" in prod). On staging it is set to "-" so
  // hostnames stay one level under lumero.fr ("...-preview-dev.lumero.fr"),
  // which Cloudflare's *.lumero.fr wildcard cert covers — a two-level
  // "*.dev.lumero.fr" wildcard is not covered by Universal SSL.
  const sep = process.env.PREVIEW_HOSTNAME_SEP ?? ".";
  return `${slug}-${shortId}-preview${sep}${base}`;
}

export function previewUrlForProject(slug: string, projectId: string): string {
  return `https://${previewHostnameForProject(slug, projectId)}`;
}

/**
 * Map orchestrator runtime state to Lume's previewStatus column.
 * previewStatus values used in the app: NONE | PROVISIONING | STARTING |
 * BUILDING | RUNNING | STOPPED | ERROR | REVIEW_SENT
 */
export function mapStateToPreviewStatus(state: OrchestratorState): string {
  return state;
}
