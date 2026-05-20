import express, { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { storage, PreviewRow } from "./storage";
import { config } from "./config";

export const proxy = Router();

type AuthzResult = { authenticated: boolean; allowed: boolean };

// Short-lived cache keyed by (projectId|cookie) to avoid calling the main app on
// every single asset request of a page load.
const AUTHZ_TTL_MS = 30_000;
const authzCache = new Map<string, { result: AuthzResult; expires: number }>();

async function authorizeVisitor(
  projectId: string,
  cookieHeader: string
): Promise<AuthzResult> {
  const key = `${projectId}|${cookieHeader}`;
  const cached = authzCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;

  let result: AuthzResult = { authenticated: false, allowed: false };
  try {
    const res = await fetch(
      `${config.MAIN_APP_INTERNAL_URL}/api/preview/authorize?projectId=${encodeURIComponent(projectId)}`,
      {
        headers: {
          "x-internal-token": config.INTERNAL_API_TOKEN,
          cookie: cookieHeader,
        },
      }
    );
    if (res.ok) result = (await res.json()) as AuthzResult;
  } catch (err) {
    console.error(`[proxy] authorize call failed: ${(err as Error).message}`);
  }

  // Only cache positive answers; negatives may flip as soon as the user logs in
  // or is granted access, and we don't want to make them wait the full TTL.
  if (result.allowed) {
    if (authzCache.size > 5000) authzCache.clear();
    authzCache.set(key, { result, expires: Date.now() + AUTHZ_TTL_MS });
  }
  return result;
}

const asleepPage = (preview: PreviewRow) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Preview en veille — ${preview.slug}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f5f5;margin:0;display:grid;place-items:center;min-height:100vh}
  .card{max-width:480px;padding:48px 32px;text-align:center}
  h1{font-size:1.5rem;margin:0 0 12px}
  p{color:#a3a3a3;line-height:1.6;margin:0 0 24px}
  .slug{font-family:ui-monospace,monospace;color:#fef3c7}
  .state{display:inline-block;padding:4px 10px;border-radius:999px;background:#1f2937;color:#9ca3af;font-size:0.85rem}
</style>
</head>
<body>
  <div class="card">
    <h1>Cette preview est en veille 🌙</h1>
    <p>La preview <span class="slug">${preview.slug}</span> n'est pas actuellement en cours d'exécution.</p>
    <p>Connecte-toi à ton espace client sur <a href="https://lumero.fr" style="color:#60a5fa">lumero.fr</a> pour la réveiller.</p>
    <span class="state">${preview.state}</span>
  </div>
</body>
</html>`;

const errorPage = (preview: PreviewRow) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Erreur de preview — ${preview.slug}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f5f5;margin:0;display:grid;place-items:center;min-height:100vh}
  .card{max-width:560px;padding:48px 32px;text-align:center}
  h1{font-size:1.5rem;margin:0 0 12px}
  pre{background:#1f2937;color:#fca5a5;padding:12px;border-radius:8px;overflow:auto;font-size:0.85rem;text-align:left}
</style>
</head>
<body>
  <div class="card">
    <h1>La preview n'a pas pu démarrer ⚠️</h1>
    <pre>${(preview.errorMessage ?? "Unknown error").replace(/[<>&]/g, (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!)
    )}</pre>
  </div>
</body>
</html>`;

// Cache of proxy middlewares per target container to keep keep-alive sockets warm.
const proxyCache = new Map<string, express.RequestHandler>();

function getProxyFor(target: string): express.RequestHandler {
  const cached = proxyCache.get(target);
  if (cached) return cached;
  const mw = createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    on: {
      error(err, _req, res) {
        console.error(`[proxy] upstream error → ${target}: ${err.message}`);
        if ("writeHead" in res && !res.headersSent) {
          (res as { writeHead: (s: number) => void }).writeHead(502);
        }
        if ("end" in res) (res as { end: (b?: string) => void }).end("Bad gateway");
      },
    },
  }) as unknown as express.RequestHandler;
  proxyCache.set(target, mw);
  return mw;
}

proxy.use((req, res, next) => {
  const host = (req.header("host") ?? "").toLowerCase();
  if (!host) {
    res.status(400).send("missing Host header");
    return;
  }

  const preview = storage.byHostname(host);
  if (!preview) {
    res.status(404).send("preview not found");
    return;
  }

  if (preview.state === "ERROR") {
    res.status(503).type("html").send(errorPage(preview));
    return;
  }
  if (preview.state !== "RUNNING") {
    res.status(503).type("html").send(asleepPage(preview));
    return;
  }

  // Access control: only the project owner, admins, or explicitly granted users
  // may view the preview. Everyone else is bounced to the main app.
  authorizeVisitor(preview.id, req.header("cookie") ?? "")
    .then((authz) => {
      if (!authz.allowed) {
        const dest = `${config.MAIN_APP_PUBLIC_URL}/preview-access?project=${encodeURIComponent(
          preview.id
        )}`;
        res.redirect(302, dest);
        return;
      }

      // Update last-access (best effort, async)
      storage.update(preview.id, { lastAccessAt: Date.now() });

      const target = `http://${preview.containerName}:${preview.port}`;
      getProxyFor(target)(req, res, next);
    })
    .catch((err) => {
      console.error(`[proxy] authorize error: ${(err as Error).message}`);
      res.status(502).send("Bad gateway");
    });
});
