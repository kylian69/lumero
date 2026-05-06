const VERCEL_API = "https://api.vercel.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${teamId}` : "";
}

async function vercelFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel API ${options?.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  // Some endpoints return 204 No Content
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function createVercelProject(
  slug: string,
  githubFullName: string
): Promise<{ projectId: string }> {
  const data = await vercelFetch(`/v10/projects${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({
      name: `lumero-${slug}`,
      gitRepository: {
        type: "github",
        repo: githubFullName,
      },
    }),
  });

  return { projectId: data.id as string };
}

export async function registerVercelWebhook(projectId: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set");

  await vercelFetch(`/v1/webhooks${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({
      url: `${appUrl}/api/webhooks/vercel`,
      events: ["deployment.succeeded", "deployment.error"],
      projectIds: [projectId],
    }),
  });
}

type VercelDeployment = {
  uid: string;
  url: string;
  state: string;
  meta?: { githubCommitRef?: string };
  createdAt: number;
};

export async function getLatestPreviewDeployment(
  projectId: string
): Promise<{ url: string; state: string } | null> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const params = new URLSearchParams({ projectId, limit: "20" });
  if (teamId) params.set("teamId", teamId);

  const data = await vercelFetch(`/v6/deployments?${params.toString()}`);
  const deployments = (data?.deployments ?? []) as VercelDeployment[];

  // Find the most recent deployment from the "preview" branch
  const previewDeployment = deployments.find(
    (d) => d.meta?.githubCommitRef === "preview"
  );

  if (!previewDeployment) return null;

  return {
    url: `https://${previewDeployment.url}`,
    state: previewDeployment.state,
  };
}
