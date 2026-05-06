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

export async function createGithubRepo(slug: string): Promise<{
  repoName: string;
  repoUrl: string;
  fullName: string;
}> {
  const org = process.env.GITHUB_ORG;
  if (!org) throw new Error("GITHUB_ORG is not set");

  const repoName = `lumero-${slug}`;
  const data = await ghFetch(`/orgs/${org}/repos`, {
    method: "POST",
    body: JSON.stringify({
      name: repoName,
      private: true,
      auto_init: true,
      description: `Site client Lumero — ${slug}`,
    }),
  });

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
