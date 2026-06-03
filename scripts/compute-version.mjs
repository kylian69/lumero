#!/usr/bin/env node
// Compute the application's semantic version from git history.
// Strategy:
//   - Find the highest v<semver> tag in the whole repo (the last release).
//   - Inspect the commits accumulated on the integration branch (`develop`)
//     since that tag and bump:
//       * major  if any commit has "BREAKING CHANGE" in body or "!" before ":"
//       * minor  if any commit starts with "feat"
//       * patch  otherwise (and only if there is at least one commit)
//   - The version is ALWAYS derived from `develop`, regardless of the branch
//     being built. This guarantees prod (main) and dev (develop) converge on
//     the same version: promoting develop -> main releases exactly the version
//     that was validated on dev, instead of recomputing a different bump from
//     a squashed merge commit.
//   - If no tag exists, start from package.json's "version" field.
// Output (stdout): JSON { version, commit, date, channel }

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function git(cmd, fallback = "") {
  try {
    return execSync(`git ${cmd}`, { cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

function parseSemver(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v || "");
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function bump(semver, kind) {
  if (kind === "major") return { major: semver.major + 1, minor: 0, patch: 0 };
  if (kind === "minor") return { major: semver.major, minor: semver.minor + 1, patch: 0 };
  return { major: semver.major, minor: semver.minor, patch: semver.patch + 1 };
}

function fmt(s) {
  return `${s.major}.${s.minor}.${s.patch}`;
}

const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const fallbackVersion = pkg.version || "0.1.0";

// Find the highest SemVer tag in the whole repo (not just ancestors of HEAD).
// On branches like `develop`, release tags live on `main` and are not part of
// the develop history, so `git describe` would return empty and the version
// would stay stuck on package.json's fallback.
const allTags = git("tag --list 'v[0-9]*.[0-9]*.[0-9]*'")
  .split("\n")
  .map((t) => t.trim())
  .filter(Boolean)
  .map((t) => ({ tag: t, sv: parseSemver(t) }))
  .filter((x) => x.sv)
  .sort((a, b) => {
    if (a.sv.major !== b.sv.major) return b.sv.major - a.sv.major;
    if (a.sv.minor !== b.sv.minor) return b.sv.minor - a.sv.minor;
    return b.sv.patch - a.sv.patch;
  });

const lastTag = allTags[0]?.tag || "";
const base = parseSemver(lastTag) ?? parseSemver(fallbackVersion) ?? { major: 0, minor: 1, patch: 0 };

// Resolve the integration branch ref used to decide the bump. We always read
// the bump from `develop` so prod and dev land on the same version. Prefer the
// remote-tracking ref (available in CI after fetch), fall back to the local
// branch, then to HEAD when neither exists (e.g. a fresh shallow checkout).
const releaseRef =
  ["origin/develop", "develop"].find((ref) => git(`rev-parse --verify --quiet ${ref}`)) || "HEAD";

// Count commits accumulated on the integration branch since the last release,
// using the merge-base so the bump only reflects genuinely new work.
let range = releaseRef;
if (lastTag) {
  const mergeBase = git(`merge-base ${lastTag} ${releaseRef}`);
  range = mergeBase ? `${mergeBase}..${releaseRef}` : `${lastTag}..${releaseRef}`;
}
const log = git(`log ${range} --pretty=format:%s%n%b%n--END--`);

let bumpKind = null;
if (log) {
  const commits = log.split("--END--").map((c) => c.trim()).filter(Boolean);
  for (const c of commits) {
    const subject = c.split("\n")[0] || "";
    if (/^[a-zA-Z]+(\(.+\))?!:/.test(subject) || /BREAKING CHANGE/.test(c)) {
      bumpKind = "major";
      break;
    }
    if (/^feat(\(.+\))?:/.test(subject)) {
      bumpKind = bumpKind === "major" ? bumpKind : "minor";
    } else if (!bumpKind) {
      bumpKind = "patch";
    }
  }
}

const next = bumpKind ? bump(base, bumpKind) : base;
const commit = git("rev-parse --short HEAD") || "dev";
const date = git("log -1 --format=%cI") || new Date().toISOString();
const branch = git("rev-parse --abbrev-ref HEAD") || "";
const channel = branch === "main" ? "stable" : branch ? `pre-${branch}` : "dev";

const version = bumpKind && lastTag ? fmt(next) : fmt(base);

process.stdout.write(JSON.stringify({ version, commit, date, channel }) + "\n");
