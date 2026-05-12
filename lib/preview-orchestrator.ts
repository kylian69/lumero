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

export async function destroyPreview(id: string): Promise<void> {
  await call(`/api/projects/${id}`, { method: "DELETE" });
}

/**
 * Public URL of a preview, deterministic from the slug.
 * The orchestrator routes <slug>.preview.lumero.fr → corresponding container.
 */
export function previewUrlForSlug(slug: string): string {
  const base = process.env.PREVIEW_BASE_DOMAIN ?? "preview.lumero.fr";
  return `https://${slug}.${base}`;
}

/**
 * Map orchestrator runtime state to Lume's previewStatus column.
 * previewStatus values used in the app: NONE | PROVISIONING | STARTING |
 * BUILDING | RUNNING | STOPPED | ERROR | REVIEW_SENT
 */
export function mapStateToPreviewStatus(state: OrchestratorState): string {
  return state;
}
