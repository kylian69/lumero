import { Router } from "express";
import { z } from "zod";
import { config } from "./config";
import { storage } from "./storage";
import { buildAndStart, destroy, provision, start, stop } from "./lifecycle";
import { ensureDnsRecord } from "./cloudflare";

export const api = Router();

api.use((req, res, next) => {
  const token = req.header("x-internal-token");
  if (token !== config.INTERNAL_API_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

const provisionBody = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "invalid slug"),
  hostname: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, "invalid hostname"),
  githubRepoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  githubBranch: z.string().default("preview"),
});

api.post("/projects", async (req, res) => {
  const parsed = provisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const preview = provision(parsed.data);
  // Best-effort: ensure the preview hostname resolves to the tunnel. No-op
  // unless DNS automation is configured (staging). Failure shouldn't block
  // registration — it's surfaced in logs and retried on next provision.
  ensureDnsRecord(preview.hostname).catch((err) =>
    console.error("[api] ensureDnsRecord failed:", err)
  );
  res.json({ preview });
});

api.get("/projects/:id", (req, res) => {
  const preview = storage.byId(req.params.id);
  if (!preview) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ preview });
});

api.post("/projects/:id/start", async (req, res) => {
  const preview = storage.byId(req.params.id);
  if (!preview) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  // Fire and forget: client polls /status
  start(preview).catch((err) => console.error("[api] start failed:", err));
  res.json({ preview: storage.byId(req.params.id) });
});

api.post("/projects/:id/stop", async (req, res) => {
  const preview = storage.byId(req.params.id);
  if (!preview) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await stop(preview);
  res.json({ preview: storage.byId(req.params.id) });
});

api.post("/projects/:id/redeploy", async (req, res) => {
  const preview = storage.byId(req.params.id);
  if (!preview) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  buildAndStart(preview).catch((err) =>
    console.error("[api] redeploy failed:", err)
  );
  res.json({ preview: storage.byId(req.params.id) });
});

api.delete("/projects/:id", async (req, res) => {
  const preview = storage.byId(req.params.id);
  if (!preview) {
    // Project not in DB (e.g. state was wiped). If the caller provides the
    // slug we can still clean up the container and image.
    const slug = typeof req.query.slug === "string" ? req.query.slug : null;
    if (slug) {
      const { removeContainerIfExists, removeImageIfExists, containerNameForSlug, imageNameForSlug } = await import("./docker");
      await removeContainerIfExists(containerNameForSlug(slug));
      await removeImageIfExists(imageNameForSlug(slug));
      console.log(`[api] destroy fallback for unknown id=${req.params.id} slug=${slug}`);
      res.json({ ok: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
    return;
  }
  await destroy(preview);
  res.json({ ok: true });
});

api.get("/projects", (_req, res) => {
  res.json({ previews: storage.all() });
});
