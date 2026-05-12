const GITHUB_API = "https://api.github.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function ghFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${options?.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

async function isOrganization(account: string): Promise<boolean> {
  try {
    const res = await fetch(`${GITHUB_API}/orgs/${account}`, {
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createGithubRepo(slug: string): Promise<{
  repoName: string;
  repoUrl: string;
  fullName: string;
}> {
  const account = process.env.GITHUB_ORG;
  if (!account) throw new Error("GITHUB_ORG is not set");

  const repoName = `lumero-${slug}`;
  const body = JSON.stringify({
    name: repoName,
    private: true,
    auto_init: true,
    description: `Site client Lumero — ${slug}`,
  });

  // Use org endpoint for organizations, user endpoint for personal accounts
  const isOrg = await isOrganization(account);
  const endpoint = isOrg ? `/orgs/${account}/repos` : `/user/repos`;

  const data = await ghFetch(endpoint, { method: "POST", body });

  return {
    repoName,
    repoUrl: data.html_url as string,
    fullName: data.full_name as string,
  };
}

export async function createGithubBranch(
  fullName: string,
  branch: string
): Promise<void> {
  // Get SHA of main branch
  const ref = await ghFetch(`/repos/${fullName}/git/ref/heads/main`);
  const sha = ref.object.sha as string;

  await ghFetch(`/repos/${fullName}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha,
    }),
  });
}

/**
 * Register a push webhook on a preview repo so the orchestrator can
 * auto-rebuild on commits. Returns the webhook id if created.
 */
export async function createGithubWebhook(
  fullName: string,
  url: string,
  secret: string
): Promise<{ id: number }> {
  const data = await ghFetch(`/repos/${fullName}/hooks`, {
    method: "POST",
    body: JSON.stringify({
      name: "web",
      active: true,
      events: ["push"],
      config: {
        url,
        content_type: "json",
        secret,
        insecure_ssl: "0",
      },
    }),
  });
  return { id: data.id as number };
}
