import path from "node:path";
import fs from "node:fs";
import { simpleGit } from "simple-git";
import { config } from "./config";
import { buildImage, imageNameForSlug } from "./docker";

export const workspaceForSlug = (slug: string) =>
  path.join(config.DATA_DIR, "workspaces", slug);

function authedRepoUrl(repoFullName: string): string {
  return `https://x-access-token:${config.GITHUB_TOKEN}@github.com/${repoFullName}.git`;
}

/**
 * Clone or fast-forward the preview branch into the workspace.
 * Returns the HEAD commit sha.
 */
export async function syncRepo(opts: {
  slug: string;
  repoFullName: string;
  branch: string;
}): Promise<string> {
  const dir = workspaceForSlug(opts.slug);
  const url = authedRepoUrl(opts.repoFullName);

  if (!fs.existsSync(path.join(dir, ".git"))) {
    fs.mkdirSync(dir, { recursive: true });
    await simpleGit().clone(url, dir, ["--branch", opts.branch, "--depth", "20"]);
  } else {
    const git = simpleGit(dir);
    await git.remote(["set-url", "origin", url]);
    await git.fetch("origin", opts.branch);
    await git.checkout(opts.branch);
    await git.reset(["--hard", `origin/${opts.branch}`]);
  }

  const sha = await simpleGit(dir).revparse(["HEAD"]);
  return sha.trim();
}

/**
 * Build the preview Docker image from the cloned workspace.
 * Requires a Dockerfile at the root of the repo.
 */
export async function buildPreviewImage(opts: {
  slug: string;
  onLog?: (line: string) => void;
}): Promise<{ imageName: string }> {
  const dir = workspaceForSlug(opts.slug);
  if (!fs.existsSync(path.join(dir, "Dockerfile"))) {
    throw new Error(
      `No Dockerfile found in preview repo for "${opts.slug}". ` +
        `Each preview repository must include a Dockerfile at its root.`
    );
  }
  const imageName = imageNameForSlug(opts.slug);
  await buildImage({ contextDir: dir, imageName, onLog: opts.onLog });
  return { imageName };
}
