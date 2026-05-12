import express from "express";
import { config } from "./config";
import { api } from "./api";
import { webhook } from "./webhook";
import { proxy } from "./proxy";
import { startIdleShutdownCron } from "./cron";

const app = express();

app.get("/_health", (_req, res) => {
  res.json({ status: "ok" });
});

// Internal API for Lume (JSON, token-auth)
app.use("/api", express.json({ limit: "1mb" }), api);

// GitHub webhook (raw body for HMAC)
app.use("/webhook", webhook);

// Everything else: proxy to the preview container matching the Host header
app.use(proxy);

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(
    `[orchestrator] listening on :${config.PORT}, base domain=${config.PREVIEW_BASE_DOMAIN}, network=${config.PREVIEW_NETWORK}`
  );
});

startIdleShutdownCron();
