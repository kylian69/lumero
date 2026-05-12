import crypto from "node:crypto";
import { Router, raw } from "express";
import { config } from "./config";
import { storage } from "./storage";
import { buildAndStart } from "./lifecycle";

export const webhook = Router();

/**
 * GitHub webhook receiver. We use raw body to verify HMAC.
 * In GitHub, register: Content-Type=application/json, Secret=GITHUB_WEBHOOK_SECRET,
 * Events: just the "push" event.
 */
webhook.post(
  "/github",
  raw({ type: "*/*", limit: "5mb" }),
  async (req, res) => {
    const sig = req.header("x-hub-signature-256") ?? "";
    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", config.GITHUB_WEBHOOK_SECRET)
        .update(req.body as Buffer)
        .digest("hex");

    try {
      if (
        sig.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      ) {
        res.status(401).send("invalid signature");
        return;
      }
    } catch {
      res.status(401).send("invalid signature");
      return;
    }

    const event = req.header("x-github-event");
    if (event === "ping") {
      res.json({ ok: true, pong: true });
      return;
    }
    if (event !== "push") {
      res.json({ ok: true, ignored: true });
      return;
    }

    const payload = JSON.parse((req.body as Buffer).toString("utf8"));
    const repoFullName: string | undefined = payload?.repository?.full_name;
    const ref: string | undefined = payload?.ref; // refs/heads/<branch>
    if (!repoFullName || !ref) {
      res.status(400).json({ error: "malformed payload" });
      return;
    }

    const branch = ref.replace(/^refs\/heads\//, "");
    const preview = storage.byRepo(repoFullName);
    if (!preview) {
      res.json({ ok: true, ignored: true, reason: "no matching preview" });
      return;
    }
    if (preview.githubBranch !== branch) {
      res.json({ ok: true, ignored: true, reason: "branch mismatch" });
      return;
    }

    // Only rebuild if the preview is currently RUNNING. Otherwise, the next
    // `start` call will pick up the latest commit automatically.
    if (preview.state === "RUNNING" || preview.state === "BUILDING") {
      buildAndStart(preview).catch((err) =>
        console.error(`[webhook] rebuild failed for ${preview.slug}:`, err)
      );
      res.json({ ok: true, rebuilding: true });
      return;
    }

    res.json({ ok: true, deferred: true });
  }
);
