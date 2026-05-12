import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { config } from "./config";

export type PreviewState =
  | "STOPPED"
  | "STARTING"
  | "BUILDING"
  | "RUNNING"
  | "ERROR";

export type PreviewRow = {
  id: string;
  slug: string;
  githubRepoFullName: string;
  githubBranch: string;
  hostname: string;
  containerName: string | null;
  state: PreviewState;
  port: number;
  lastAccessAt: number | null;
  lastBuiltAt: number | null;
  lastBuiltSha: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
};

fs.mkdirSync(config.DATA_DIR, { recursive: true });
const db = new Database(path.join(config.DATA_DIR, "orchestrator.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS previews (
    id                   TEXT PRIMARY KEY,
    slug                 TEXT UNIQUE NOT NULL,
    githubRepoFullName   TEXT NOT NULL,
    githubBranch         TEXT NOT NULL,
    hostname             TEXT NOT NULL,
    containerName        TEXT,
    state                TEXT NOT NULL DEFAULT 'STOPPED',
    port                 INTEGER NOT NULL,
    lastAccessAt         INTEGER,
    lastBuiltAt          INTEGER,
    lastBuiltSha         TEXT,
    errorMessage         TEXT,
    createdAt            INTEGER NOT NULL,
    updatedAt            INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_previews_hostname ON previews(hostname);
  CREATE INDEX IF NOT EXISTS idx_previews_repo     ON previews(githubRepoFullName);
`);

const stmts = {
  insert: db.prepare(`
    INSERT INTO previews (
      id, slug, githubRepoFullName, githubBranch, hostname, containerName,
      state, port, createdAt, updatedAt
    ) VALUES (
      @id, @slug, @githubRepoFullName, @githubBranch, @hostname, @containerName,
      @state, @port, @createdAt, @updatedAt
    )
  `),
  update: db.prepare(`
    UPDATE previews SET
      state         = COALESCE(@state, state),
      containerName = COALESCE(@containerName, containerName),
      port          = COALESCE(@port, port),
      lastAccessAt  = COALESCE(@lastAccessAt, lastAccessAt),
      lastBuiltAt   = COALESCE(@lastBuiltAt, lastBuiltAt),
      lastBuiltSha  = COALESCE(@lastBuiltSha, lastBuiltSha),
      errorMessage  = @errorMessage,
      updatedAt     = @updatedAt
    WHERE id = @id
  `),
  delete: db.prepare(`DELETE FROM previews WHERE id = ?`),
  byId: db.prepare(`SELECT * FROM previews WHERE id = ?`),
  bySlug: db.prepare(`SELECT * FROM previews WHERE slug = ?`),
  byHostname: db.prepare(`SELECT * FROM previews WHERE hostname = ?`),
  byRepo: db.prepare(`SELECT * FROM previews WHERE githubRepoFullName = ?`),
  all: db.prepare(`SELECT * FROM previews`),
  runningIdle: db.prepare(`
    SELECT * FROM previews
    WHERE state = 'RUNNING'
      AND (lastAccessAt IS NULL OR lastAccessAt < ?)
  `),
};

export const storage = {
  create(row: Omit<PreviewRow, "lastAccessAt" | "lastBuiltAt" | "lastBuiltSha" | "errorMessage">) {
    stmts.insert.run(row);
    return stmts.byId.get(row.id) as PreviewRow;
  },
  update(
    id: string,
    patch: Partial<
      Pick<
        PreviewRow,
        "state" | "containerName" | "port" | "lastAccessAt" | "lastBuiltAt" | "lastBuiltSha" | "errorMessage"
      >
    >
  ) {
    stmts.update.run({
      id,
      state: patch.state ?? null,
      containerName: patch.containerName ?? null,
      port: patch.port ?? null,
      lastAccessAt: patch.lastAccessAt ?? null,
      lastBuiltAt: patch.lastBuiltAt ?? null,
      lastBuiltSha: patch.lastBuiltSha ?? null,
      errorMessage: patch.errorMessage ?? null,
      updatedAt: Date.now(),
    });
    return stmts.byId.get(id) as PreviewRow;
  },
  delete(id: string) {
    stmts.delete.run(id);
  },
  byId(id: string) {
    return stmts.byId.get(id) as PreviewRow | undefined;
  },
  bySlug(slug: string) {
    return stmts.bySlug.get(slug) as PreviewRow | undefined;
  },
  byHostname(hostname: string) {
    return stmts.byHostname.get(hostname) as PreviewRow | undefined;
  },
  byRepo(repoFullName: string) {
    return stmts.byRepo.get(repoFullName) as PreviewRow | undefined;
  },
  all() {
    return stmts.all.all() as PreviewRow[];
  },
  runningIdleBefore(thresholdMs: number) {
    return stmts.runningIdle.all(thresholdMs) as PreviewRow[];
  },
};
